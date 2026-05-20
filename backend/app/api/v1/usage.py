from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.core.auth import get_current_key
from app.database import get_db
from app.models.api_key import ApiKey
from app.models.usage_log import UsageLog
from app.schemas.usage import UsageSummary, DailyUsage, ModelUsage

router = APIRouter()


@router.get("/usage", response_model=UsageSummary)
async def get_usage(
    days: int = 30,
    _: ApiKey = Depends(get_current_key),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # Total requests + tokens
    totals = await db.execute(
        select(
            func.count(UsageLog.id).label("total_requests"),
            func.coalesce(func.sum(UsageLog.total_tokens), 0).label("total_tokens"),
        ).where(UsageLog.created_at >= since)
    )
    row = totals.one()
    total_requests: int = row.total_requests
    total_tokens: int = row.total_tokens

    # Active keys count
    active_keys_result = await db.execute(
        select(func.count(ApiKey.id)).where(ApiKey.is_active == True)
    )
    active_keys: int = active_keys_result.scalar_one()

    # Models used
    models_result = await db.execute(
        select(func.count(func.distinct(UsageLog.model))).where(
            UsageLog.created_at >= since
        )
    )
    models_used: int = models_result.scalar_one()

    # Daily breakdown
    daily_result = await db.execute(
        select(
            func.date(UsageLog.created_at).label("date"),
            func.count(UsageLog.id).label("requests"),
            func.coalesce(func.sum(UsageLog.total_tokens), 0).label("tokens"),
        )
        .where(UsageLog.created_at >= since)
        .group_by(func.date(UsageLog.created_at))
        .order_by(func.date(UsageLog.created_at))
    )
    daily_rows = daily_result.all()

    # Fill in missing days with zeros
    daily_map: dict[str, DailyUsage] = {
        r.date.strftime("%Y-%m-%d") if hasattr(r.date, "strftime") else str(r.date): DailyUsage(
            date=r.date.strftime("%Y-%m-%d") if hasattr(r.date, "strftime") else str(r.date),
            requests=r.requests,
            tokens=r.tokens,
        )
        for r in daily_rows
    }
    daily: list[DailyUsage] = []
    for i in range(days):
        d = (since + timedelta(days=i + 1)).strftime("%Y-%m-%d")
        daily.append(daily_map.get(d, DailyUsage(date=d, requests=0, tokens=0)))

    # Per-model breakdown
    model_result = await db.execute(
        select(
            UsageLog.model,
            func.count(UsageLog.id).label("requests"),
            func.coalesce(func.sum(UsageLog.total_tokens), 0).label("tokens"),
        )
        .where(UsageLog.created_at >= since)
        .group_by(UsageLog.model)
        .order_by(func.count(UsageLog.id).desc())
    )
    by_model = [
        ModelUsage(model=r.model, requests=r.requests, tokens=r.tokens)
        for r in model_result.all()
    ]

    return UsageSummary(
        total_requests=total_requests,
        total_tokens=total_tokens,
        active_keys=active_keys,
        models_used=models_used,
        daily=daily,
        by_model=by_model,
    )
