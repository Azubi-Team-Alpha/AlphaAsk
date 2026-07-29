import time
import logging
import redis as redis_lib
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger("rate_limit")

try:
    _redis = redis_lib.from_url(settings.redis_url, decode_responses=True, socket_timeout=1.0)
except Exception as e:
    _redis = None
    logger.warning(f"Redis initialization failed: {e}")


def enforce_rate_limit(user_id: str) -> None:
    if not _redis:
        return

    key = f"rate:{user_id}"
    now = time.time()
    window_start = now - 60

    try:
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
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Redis rate limit check skipped due to connection error: {e}")
        return

