from openai import AsyncOpenAI

from app.config import settings
from app.providers.openai_provider import OpenAIProvider


class DeepSeekProvider(OpenAIProvider):
    """
    DeepSeek uses an OpenAI-compatible API.
    Override only the client and model list.
    """

    def __init__(self) -> None:
        self._client = AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
        )

    def supported_models(self) -> list[str]:
        return ["deepseek-"]
