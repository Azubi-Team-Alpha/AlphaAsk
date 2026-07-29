"""
Serverless Data Models for DynamoDB Entities
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    sessions = relationship("Session", back_populates="user")


class SessionModel(BaseModel):
    session_id: str
    user_id: str
    created_at: str


class MessageModel(BaseModel):
    message_id: str
    session_id: str
    role: str  # "user" or "assistant"
    content: str
    created_at: str


class QuestionModel(BaseModel):
    id: str
    question: str
    answer: str
    session_id: str
    created_at: str


class FAQModel(BaseModel):
    id: str
    question: str
    answer: str
    category: str
    created_at: Optional[str] = None
