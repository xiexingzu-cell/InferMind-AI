import time
from redis.asyncio import Redis
from fastapi import HTTPException, status

from app.config import settings


async def check_rate_limit(redis: Redis, api_key: str) -> None:
    """Sliding window rate limiter: max N requests per 60 seconds per key."""
    now = time.time()
    window = 60  # seconds
    limit = settings.rate_limit_rpm

    redis_key = f"rate_limit:{api_key}"

    pipe = redis.pipeline()
    pipe.zremrangebyscore(redis_key, 0, now - window)
    pipe.zadd(redis_key, {str(now): now})
    pipe.zcard(redis_key)
    pipe.expire(redis_key, window * 2)
    results = await pipe.execute()

    current_count: int = results[2]
    if current_count > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": {
                    "message": f"Rate limit exceeded: {limit} requests per minute.",
                    "type": "rate_limit_error",
                    "code": "rate_limit_exceeded",
                }
            },
        )
