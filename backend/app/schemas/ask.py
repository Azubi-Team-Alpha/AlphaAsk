from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    session_id: UUID


class AskResponse(BaseModel):
    answer: str
    session_id: UUID
    timestamp: datetime


class MessageOut(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    session_id: UUID
    messages: list[MessageOut]
