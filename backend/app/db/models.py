"""
Serverless Data Models for DynamoDB Entities
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class UserModel(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    hashed_password: str
    created_at: str


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
