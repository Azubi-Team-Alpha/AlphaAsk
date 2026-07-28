from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from app.db.database import get_db
from app.db.models import Session as ChatSession, User
from app.core.deps import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", status_code=201)
def create_session(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_session = ChatSession(user_id=current_user.id)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return {"session_id": str(new_session.id)}


@router.get("")
def list_sessions(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    return [{"session_id": str(s.id), "created_at": s.created_at.isoformat()} for s in sessions]