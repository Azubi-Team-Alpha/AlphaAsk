import re
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


def _parse_ts(val):
    if not val:
        return 0
    if isinstance(val, (int, float)):
        return float(val)
    try:
        from datetime import datetime
        dt = datetime.fromisoformat(str(val).replace('Z', '+00:00'))
        return dt.timestamp() * 1000
    except Exception:
        return 0


@router.get("/conversations")
def list_conversations(current_user: dict = Depends(get_current_user)):
    sessions = dynamodb_service.list_user_sessions(user_id=current_user["user_id"])
    if not sessions:
        return []
    result = []
    for s in sessions:
        msgs = dynamodb_service.get_session_messages(s["session_id"])
        title = "Academic Question"
        last_ts = s.get("created_at") or s.get("updated_at") or 0
        if msgs:
            user_msgs = [m for m in msgs if m.get("role") == "user"]
            if user_msgs:
                txt = user_msgs[0].get("content", "").strip()
                txt = re.sub(r'^\s*📄\s*\[Attached:[^\]]+\]\s*', '', txt, flags=re.I).strip()
                if txt:
                    lines = [l.strip() for l in txt.splitlines() if l.strip()]
                    title = lines[0][:40] if lines else "Academic Question"
                elif msgs[0].get("content"):
                    title = msgs[0]["content"][:40]
            if msgs[-1].get("created_at"):
                last_ts = msgs[-1]["created_at"]

        result.append({
            "id": s["session_id"],
            "title": title,
            "updatedAt": last_ts
        })

    result.sort(key=lambda x: _parse_ts(x.get("updatedAt")), reverse=True)
    return result
