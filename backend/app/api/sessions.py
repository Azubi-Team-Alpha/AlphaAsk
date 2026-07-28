from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from app.db.database import get_db
from app.db.models import Session as ChatSession, User
from app.core.deps import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("")
def create_session(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_session = ChatSession(user_id=current_user.id)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return {"session_id": str(new_session.id)}