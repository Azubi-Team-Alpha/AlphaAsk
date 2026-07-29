"""
Serverless Database Module for AlphaAsk
Uses Amazon DynamoDB for cloud storage.
"""

from app.db.dynamodb import dynamodb_service, get_dynamodb


def get_db():
    """Dependency provider for DynamoDB service instance."""
    yield dynamodb_service
