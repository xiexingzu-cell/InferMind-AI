from typing import AsyncIterator

from app.providers.registry import get_provider
from app.schemas.chat import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionChunk,
)


async def route_completion(
    request: ChatCompletionRequest,
) -> ChatCompletionResponse:
    provider = get_provider(request.model)
    return await provider.chat_completion(request)


async def route_completion_stream(
    request: ChatCompletionRequest,
) -> AsyncIterator[ChatCompletionChunk]:
    provider = get_provider(request.model)
    async for chunk in provider.chat_completion_stream(request):
        yield chunk
