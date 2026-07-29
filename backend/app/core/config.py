from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # DynamoDB
    dynamodb_endpoint: str = ""
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    # Redis (ElastiCache)
    redis_url: str = "redis://localhost:6379"

    # JWT
    jwt_secret_key: str = "alphaask-secret-jwt-key-2026"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # AWS / Bedrock
    bedrock_model_id: str = "anthropic.claude-3-5-sonnet-20240620-v1:0"

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

settings = Settings()
