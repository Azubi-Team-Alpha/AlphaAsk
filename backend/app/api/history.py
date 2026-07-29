from fastapi import APIRouter, Depends, HTTPException, status

from app.db.dynamodb import dynamodb_service
from app.core.deps import get_current_user
from app.schemas.ask import HistoryResponse, MessageOut

router = APIRouter(tags=["history"])


@router.get("/history/{session_id}", response_model=HistoryResponse)
def get_history(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    session = dynamodb_service.get_session(session_id)
    if not session or session["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    messages = dynamodb_service.get_session_messages(session_id)

    return HistoryResponse(
        session_id=session_id,
        messages=[MessageOut(role=m["role"], content=m["content"], created_at=m["created_at"]) for m in messages],
    )


@router.get("/conversations")
def list_conversations(current_user: dict = Depends(get_current_user)):
    sessions = dynamodb_service.list_user_sessions(user_id=current_user["user_id"])
    if not sessions:
        return []
    result = []
    for s in sessions:
        msgs = dynamodb_service.get_session_messages(s["session_id"])
        title = msgs[0]["content"][:48] if msgs else "New Chat"
        result.append({
            "id": s["session_id"],
            "title": title,
            "updatedAt": s.get("created_at", 0)
        })
    return result
