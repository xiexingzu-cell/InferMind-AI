import time
from typing import AsyncIterator

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionChunk as OpenAIChunk

from app.config import settings
from app.core.logger import get_logger
from app.providers.base import AbstractProvider
from app.schemas.chat import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionChunk,
    ChatChunkChoice,
    ChatChoice,
    ChatMessage,
    DeltaMessage,
    UsageInfo,
)

logger = get_logger(__name__)


class OpenAIProvider(AbstractProvider):
    def __init__(self) -> None:
        self._client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )

    def supported_models(self) -> list[str]:
        return ["gpt-"]

    def _build_messages(self, request: ChatCompletionRequest) -> list[dict]:
        return [{"role": m.role, "content": m.content} for m in request.messages]

    def _build_kwargs(self, request: ChatCompletionRequest) -> dict:
        kwargs: dict = {
            "model": request.model,
            "messages": self._build_messages(request),
        }
        if request.temperature is not None:
            kwargs["temperature"] = request.temperature
        if request.max_tokens is not None:
            kwargs["max_tokens"] = request.max_tokens
        if request.top_p is not None:
            kwargs["top_p"] = request.top_p
        if request.frequency_penalty is not None:
            kwargs["frequency_penalty"] = request.frequency_penalty
        if request.presence_penalty is not None:
            kwargs["presence_penalty"] = request.presence_penalty
        if request.stop is not None:
            kwargs["stop"] = request.stop
        return kwargs

    async def chat_completion(
        self, request: ChatCompletionRequest
    ) -> ChatCompletionResponse:
        kwargs = self._build_kwargs(request)
        response = await self._client.chat.completions.create(**kwargs)

        return ChatCompletionResponse(
            id=response.id,
            created=response.created,
            model=response.model,
            choices=[
                ChatChoice(
                    index=c.index,
                    message=ChatMessage(
                        role=c.message.role,
                        content=c.message.content or "",
                    ),
                    finish_reason=c.finish_reason,
                )
                for c in response.choices
            ],
            usage=UsageInfo(
                prompt_tokens=response.usage.prompt_tokens if response.usage else 0,
                completion_tokens=response.usage.completion_tokens if response.usage else 0,
                total_tokens=response.usage.total_tokens if response.usage else 0,
            ),
        )

    async def chat_completion_stream(
        self, request: ChatCompletionRequest
    ) -> AsyncIterator[ChatCompletionChunk]:
        kwargs = self._build_kwargs(request)
        kwargs["stream"] = True

        stream = await self._client.chat.completions.create(**kwargs)

        async for chunk in stream:
            chunk: OpenAIChunk
            choices = [
                ChatChunkChoice(
                    index=c.index,
                    delta=DeltaMessage(
                        role=c.delta.role,
                        content=c.delta.content,
                    ),
                    finish_reason=c.finish_reason,
                )
                for c in chunk.choices
            ]
            yield ChatCompletionChunk(
                id=chunk.id,
                created=chunk.created,
                model=chunk.model,
                choices=choices,
            )
