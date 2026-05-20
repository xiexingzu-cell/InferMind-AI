import time

from fastapi import APIRouter, Depends

from app.core.auth import get_current_key
from app.models.api_key import ApiKey
from app.providers.registry import list_available_models

router = APIRouter()


@router.get("/models")
async def list_models(api_key: ApiKey = Depends(get_current_key)):
    return {
        "object": "list",
        "data": [
            {**m, "created": int(time.time())}
            for m in list_available_models()
        ],
    }
