from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from datetime import datetime, timezone

from app.db.database import get_db
from app.db.models import User, Session as ChatSession
from app.core.deps import get_current_user
from app.schemas.ask import AskRequest, AskResponse
from app.services.conversation_service import get_conversation_history, save_message
from app.services.llm_service import get_llm_response, LLMError
from app.core.rate_limit import enforce_rate_limit

router = APIRouter(tags=["ask"])


@router.post("/ask", response_model=AskResponse)
def ask(
    payload: AskRequest,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Rate limit check (Redis) — covered fully in Part 6
    enforce_rate_limit(user_id=str(current_user.id))

    # 2. Confirm the session belongs to this user (prevents reading someone else's chat)
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == payload.session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # 3. Pull recent conversation history for context
    history = get_conversation_history(db, payload.session_id)

    # 4. Call the LLM
    try:
        answer = get_llm_response(history, payload.question)
    except LLMError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))

    # 5. Persist both sides of the exchange
    save_message(db, payload.session_id, role="user", content=payload.question)
    save_message(db, payload.session_id, role="assistant", content=answer)

    return AskResponse(
        answer=answer,
        session_id=payload.session_id,
        timestamp=datetime.now(timezone.utc),
    )