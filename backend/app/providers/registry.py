from app.providers.base import AbstractProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.deepseek_provider import DeepSeekProvider

# Singleton provider instances (one HTTP client per provider)
_openai = OpenAIProvider()
_deepseek = DeepSeekProvider()

# Model prefix → provider.
# Longest-prefix match wins — order matters if prefixes overlap.
PROVIDER_REGISTRY: list[tuple[str, AbstractProvider]] = [
    ("gpt-", _openai),
    ("o1-", _openai),
    ("o3-", _openai),
    ("deepseek-", _deepseek),
]


def get_provider(model: str) -> AbstractProvider:
    for prefix, provider in PROVIDER_REGISTRY:
        if model.startswith(prefix):
            return provider
    raise ValueError(f"Unsupported model: {model!r}")


def list_available_models() -> list[dict]:
    """Return an OpenAI-compatible model list."""
    models = [
        # OpenAI
        {"id": "gpt-4o", "object": "model", "owned_by": "openai"},
        {"id": "gpt-4o-mini", "object": "model", "owned_by": "openai"},
        {"id": "gpt-4-turbo", "object": "model", "owned_by": "openai"},
        {"id": "o1-mini", "object": "model", "owned_by": "openai"},
        # DeepSeek
        {"id": "deepseek-chat", "object": "model", "owned_by": "deepseek"},
        {"id": "deepseek-reasoner", "object": "model", "owned_by": "deepseek"},
    ]
    return models
