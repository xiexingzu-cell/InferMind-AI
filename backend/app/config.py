from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Environment
    environment: str = "development"
    log_level: str = "INFO"

    # Database
    database_url: str = "postgresql+asyncpg://gateway:gateway_dev@localhost:5432/ai_gateway"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Platform
    secret_key: str = "dev_secret_change_in_production"

    # CORS — comma-separated origins, e.g. "https://yourdomain.com,https://www.yourdomain.com"
    # Use "*" (default) only in development
    cors_origins: str = "*"

    # Internal key for the public frontend — set this in .env and NEXT_PUBLIC_INTERNAL_API_KEY
    # Users access the Chat UI without needing their own API key.
    # Generate: python -c "import secrets; print('gw-' + secrets.token_urlsafe(16))"
    internal_api_key: str = "gw-dev-internal-key"

    # Provider keys
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com/v1"
    gemini_api_key: str = ""

    # Rate limiting (requests per minute per API key)
    rate_limit_rpm: int = 60

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def cors_origins_list(self) -> list[str]:
        if self.cors_origins == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
