from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from uuid import UUID

from app.db.database import get_db
from app.db.models import User, Session as ChatSession, Message
from app.core.deps import get_current_user
from app.schemas.ask import HistoryResponse, MessageOut

router = APIRouter(tags=["history"])


@router.get("/history/{session_id}", response_model=HistoryResponse)
def get_history(
    session_id: UUID,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    return HistoryResponse(
        session_id=session_id,
        messages=[MessageOut.model_validate(m) for m in messages],
    )
