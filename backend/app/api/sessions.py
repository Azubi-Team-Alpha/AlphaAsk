from fastapi import APIRouter, Depends
from app.db.dynamodb import dynamodb_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", status_code=201)
def create_session(current_user: dict = Depends(get_current_user)):
    session = dynamodb_service.create_session(user_id=current_user["user_id"])
    return {"session_id": session["session_id"]}


@router.get("")
def list_sessions(current_user: dict = Depends(get_current_user)):
    sessions = dynamodb_service.list_user_sessions(user_id=current_user["user_id"])
    return [
        {"session_id": s["session_id"], "created_at": s["created_at"]}
        for s in sessions
    ]
