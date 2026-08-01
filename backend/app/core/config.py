from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # DynamoDB
    dynamodb_endpoint: str = ""
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    # Redis (ElastiCache)
    redis_url: str = "redis://localhost:6379"

    # JWT — must be set via JWT_SECRET_KEY env var (no insecure default)
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # AWS / Bedrock
    bedrock_model_id: str = "us.anthropic.claude-3-5-sonnet-20241022-v2:0"

    # External Fallback AI Keys
    gemini_api_key: str = ""
    groq_api_key: str = ""

    # Rate limiting
    rate_limit_per_minute: int = 10

    # DynamoDB Table Names
    users_table: str = "alphaask-Users"
    sessions_table: str = "alphaask-Sessions"
    messages_table: str = "alphaask-Messages"
    questions_table: str = "alphaask-Questions"
    faq_table: str = "alphaask-FAQ"

    # Legacy / Optional fallback
    database_url: str = ""

    @field_validator("jwt_secret_key")
    @classmethod
    def jwt_secret_must_be_strong(cls, v: str) -> str:
        # In test environments (CI) an empty or short key is allowed;
        # in any real deployment the key must be at least 32 chars.
        import os
        is_test = os.getenv("PYTEST_CURRENT_TEST") or os.getenv("CI") or os.getenv("AWS_ACCESS_KEY_ID") == "testing"
        if not is_test and len(v) < 32:
            raise ValueError(
                "JWT_SECRET_KEY must be at least 32 characters. "
                "Set it via the JWT_SECRET_KEY environment variable."
            )
        # Fall back to a safe test-only secret when running tests without one set
        if not v:
            return "alphaask-test-only-secret-not-for-production-use"
        return v

settings = Settings()
