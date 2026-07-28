import time
import redis as redis_lib
from fastapi import HTTPException, status
from app.core.config import settings

_redis = redis_lib.from_url(settings.redis_url, decode_responses=True)


def enforce_rate_limit(user_id: str) -> None:
    key = f"rate:{user_id}"
    now = time.time()
    window_start = now - 60

    pipe = _redis.pipeline()
    pipe.zremrangebyscore(key, "-inf", window_start)
    pipe.zadd(key, {str(now): now})
    pipe.zcard(key)
    pipe.expire(key, 60)
    results = pipe.execute()

    count = results[2]
    if count > settings.rate_limit_per_minute:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait before sending another request.",
        )
