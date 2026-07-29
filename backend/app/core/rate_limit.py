import redis
import logging
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger("app.core.rate_limit")

try:
    redis_client = redis.from_url(settings.redis_url, decode_responses=True)
except Exception as e:
    logger.error(f"Could not connect to Redis: {e}")
    redis_client = None

def enforce_rate_limit(user_id: str):
    if redis_client is None:
        # Fail-open if Redis client failed initialization
        return

    key = f"rate_limit:{user_id}"
    try:
        current_count = redis_client.incr(key)
        if current_count == 1:
            redis_client.expire(key, 60)
        
        if current_count > settings.rate_limit_per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {settings.rate_limit_per_minute} requests per minute."
            )
    except redis.RedisError as e:
        # Fail-open if Redis error occurs during execution
        logger.error(f"Redis rate limiter error: {e}")
