from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.sql import func

from app.config import settings
from app.database import get_db
from app.models.api_key import ApiKey

bearer_scheme = HTTPBearer()

_internal_api_key: str | None = (
    settings.internal_api_key.strip() if settings.internal_api_key else None
)


def _make_internal_key(name: str = "platform") -> ApiKey:
    """Return a stub ApiKey for the internal/public frontend flow."""
    key = ApiKey(
        id=0,
        key=_internal_api_key or "",
        name=name,
        is_active=True,
        total_requests=0,
        total_tokens=0,
    )
    return key


async def get_current_key(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> ApiKey:
    token = credentials.credentials

    # Internal key — no DB lookup needed (public chat UI flow)
    if _internal_api_key and token == _internal_api_key:
        return _make_internal_key()

    # Database key — for API developers using SDK
    result = await db.execute(
        select(ApiKey).where(ApiKey.key == token, ApiKey.is_active == True)
    )
    api_key = result.scalar_one_or_none()

    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "message": "Invalid or revoked API key.",
                    "type": "authentication_error",
                    "code": "invalid_api_key",
                }
            },
        )

    await db.execute(
        update(ApiKey)
        .where(ApiKey.id == api_key.id)
        .values(last_used_at=func.now())
    )

    return api_key
