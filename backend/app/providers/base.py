from abc import ABC, abstractmethod
from typing import AsyncIterator

from app.schemas.chat import ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk


class AbstractProvider(ABC):
    """
    All providers must implement this interface.
    Adding a new model family = one new file inheriting this class.
    """

    @abstractmethod
    async def chat_completion(
        self, request: ChatCompletionRequest
    ) -> ChatCompletionResponse:
        """Non-streaming completion."""
        ...

    @abstractmethod
    async def chat_completion_stream(
        self, request: ChatCompletionRequest
    ) -> AsyncIterator[ChatCompletionChunk]:
        """Streaming completion — yields chunks until exhausted."""
        ...

    @abstractmethod
    def supported_models(self) -> list[str]:
        """Return model name prefixes or exact names this provider handles."""
        ...
