from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # DynamoDB
    dynamodb_endpoint: str = ""
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    # Redis (ElastiCache)
    redis_url: str = "redis://localhost:6379"

    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # AWS / Bedrock
    bedrock_model_id: str = "anthropic.claude-3-5-sonnet-20240620-v1:0"

    # Rate limiting
    rate_limit_per_minute: int = 10

    # DynamoDB Table Names
    users_table: str = "Users"
    sessions_table: str = "Sessions"
    messages_table: str = "Messages"
    faq_table: str = "FAQ"

    class Config:
        env_file = ".env"

settings = Settings()
