"""Sliding-window rate limiter using Redis — 100 req/min per user_id (Req 24)."""

import time

from fastapi import Depends, HTTPException, Request, status

from app.config import get_settings
from app.dependencies import get_current_user
from app.models.user import User

settings = get_settings()


async def rate_limit(request: Request, current_user: User = Depends(get_current_user)):
    import redis.asyncio as aioredis

    redis: aioredis.Redis = request.app.state.redis
    key = f"rate:{current_user.user_id}"
    now = int(time.time())
    window_start = now - settings.RATE_LIMIT_WINDOW_SECONDS

    pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, window_start)
    pipe.zadd(key, {str(now): now})
    pipe.zcard(key)
    pipe.expire(key, settings.RATE_LIMIT_WINDOW_SECONDS)
    results = await pipe.execute()

    count = results[2]
    if count > settings.RATE_LIMIT_REQUESTS:
        retry_after = settings.RATE_LIMIT_WINDOW_SECONDS
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={"Retry-After": str(retry_after)},
        )
