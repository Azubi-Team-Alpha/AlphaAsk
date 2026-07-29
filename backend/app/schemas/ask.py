from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    session_id: UUID | str


class AskResponse(BaseModel):
    answer: str
    session_id: UUID | str
    timestamp: datetime | str


class MessageOut(BaseModel):
    role: str
    content: str
    created_at: datetime | str

    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    session_id: UUID | str
    messages: list[MessageOut]


class QuestionOut(BaseModel):
    id: UUID | str
    question: str
    answer: str
    session_id: UUID | str
    created_at: datetime | str

    class Config:
        from_attributes = True


class FAQOut(BaseModel):
    id: UUID | str
    question: str
    answer: str
    category: str
    created_at: datetime | str

    class Config:
        from_attributes = True

