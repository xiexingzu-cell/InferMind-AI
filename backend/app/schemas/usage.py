from pydantic import BaseModel


class DailyUsage(BaseModel):
    date: str          # "YYYY-MM-DD"
    requests: int
    tokens: int


class ModelUsage(BaseModel):
    model: str
    requests: int
    tokens: int


class UsageSummary(BaseModel):
    total_requests: int
    total_tokens: int
    active_keys: int
    models_used: int
    daily: list[DailyUsage]
    by_model: list[ModelUsage]
