import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.auth import get_current_key
from app.database import get_db
from app.models.api_key import ApiKey
from app.schemas.key import ApiKeyCreate, ApiKeyResponse, ApiKeyCreated

router = APIRouter()

_KEY_PREFIX = "gw-"
_KEY_BYTES = 32


def _generate_key() -> str:
    return _KEY_PREFIX + secrets.token_urlsafe(_KEY_BYTES)


@router.post("/keys", response_model=ApiKeyCreated, status_code=status.HTTP_201_CREATED)
async def create_key(
    body: ApiKeyCreate,
    _: ApiKey = Depends(get_current_key),
    db: AsyncSession = Depends(get_db),
):
    new_key = ApiKey(name=body.name, key=_generate_key())
    db.add(new_key)
    await db.flush()
    await db.refresh(new_key)
    return new_key


@router.get("/keys", response_model=list[ApiKeyResponse])
async def list_keys(
    _: ApiKey = Depends(get_current_key),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApiKey).order_by(ApiKey.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_key(
    key_id: int,
    current: ApiKey = Depends(get_current_key),
    db: AsyncSession = Depends(get_db),
):
    if current.id == key_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"message": "Cannot revoke the key used for this request.", "type": "invalid_request_error"}},
        )
    await db.execute(
        update(ApiKey).where(ApiKey.id == key_id).values(is_active=False)
    )
