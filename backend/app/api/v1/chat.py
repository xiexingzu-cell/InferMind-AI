import time
import json
from typing import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update

from app.core.auth import get_current_key
from app.core.rate_limiter import check_rate_limit
from app.core.logger import get_logger
from app.database import get_db
from app.models.api_key import ApiKey
from app.models.usage_log import UsageLog
from app.redis_client import get_redis
from app.router.model_router import route_completion, route_completion_stream
from app.schemas.chat import ChatCompletionRequest, ChatCompletionChunk

router = APIRouter()
logger = get_logger(__name__)


def _sse_line(chunk: ChatCompletionChunk) -> str:
    return f"data: {chunk.model_dump_json(exclude_none=True)}\n\n"


async def _stream_generator(
    request: ChatCompletionRequest,
) -> AsyncIterator[str]:
    try:
        async for chunk in route_completion_stream(request):
            yield _sse_line(chunk)
        yield "data: [DONE]\n\n"
    except ValueError as exc:
        error_payload = json.dumps({
            "error": {"message": str(exc), "type": "invalid_request_error", "code": "model_not_found"}
        })
        yield f"data: {error_payload}\n\n"
    except Exception as exc:
        logger.exception("stream error", exc=str(exc))
        error_payload = json.dumps({
            "error": {"message": "Internal server error.", "type": "server_error", "code": "internal_error"}
        })
        yield f"data: {error_payload}\n\n"


def _is_internal_key(api_key: ApiKey) -> bool:
    return api_key.id == 0


def _log_usage(
    db: AsyncSession,
    api_key: ApiKey,
    model: str,
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
    total_tokens: int = 0,
    latency_ms: float = 0,
    is_stream: bool = False,
) -> None:
    """Log usage only for real DB-backed API keys (not the internal public key)."""
    if _is_internal_key(api_key):
        return

    log = UsageLog(
        api_key_id=api_key.id,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        latency_ms=latency_ms,
        is_stream=is_stream,
        status_code=200,
    )
    db.add(log)


def _update_key_stats(
    db: AsyncSession,
    api_key: ApiKey,
    tokens: int = 0,
) -> None:
    """Increment request/token counts only for real DB-backed API keys."""
    if _is_internal_key(api_key):
        return

    values = {ApiKey.total_requests: ApiKey.total_requests + 1}
    if tokens:
        values[ApiKey.total_tokens] = ApiKey.total_tokens + tokens

    db.execute(update(ApiKey).where(ApiKey.id == api_key.id).values(**values))


@router.post("/chat/completions")
async def chat_completions(
    request: ChatCompletionRequest,
    api_key: ApiKey = Depends(get_current_key),
    db: AsyncSession = Depends(get_db),
):
    redis = get_redis()
    await check_rate_limit(redis, api_key.key)

    start = time.monotonic()

    if request.stream:
        logger.info("stream request", model=request.model)

        async def tracked_stream() -> AsyncIterator[str]:
            async for line in _stream_generator(request):
                yield line
            elapsed = int((time.monotonic() - start) * 1000)
            _log_usage(db, api_key, request.model, latency_ms=elapsed, is_stream=True)
            _update_key_stats(db, api_key)

        return StreamingResponse(
            tracked_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    # Non-streaming path
    try:
        response = await route_completion(request)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "message": str(exc),
                    "type": "invalid_request_error",
                    "code": "model_not_found",
                }
            },
        )

    elapsed = int((time.monotonic() - start) * 1000)
    _log_usage(
        db, api_key, request.model,
        prompt_tokens=response.usage.prompt_tokens,
        completion_tokens=response.usage.completion_tokens,
        total_tokens=response.usage.total_tokens,
        latency_ms=elapsed,
    )
    _update_key_stats(db, api_key, tokens=response.usage.total_tokens)

    logger.info("completion done", model=request.model, tokens=response.usage.total_tokens, latency_ms=elapsed)
    return response
