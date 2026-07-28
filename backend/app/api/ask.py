from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone

from app.db.dynamodb import dynamodb_service
from app.core.deps import get_current_user
from app.schemas.ask import AskRequest, AskResponse
from app.services.llm_services import get_llm_response, LLMError
from app.core.rate_limit import enforce_rate_limit

router = APIRouter(tags=["ask"])


@router.post("/ask", response_model=AskResponse)
def ask(
    payload: AskRequest,
    current_user: dict = Depends(get_current_user),
):
    # 1. Rate limit check (Redis)
    enforce_rate_limit(user_id=current_user["user_id"])

    # 2. Confirm the session belongs to this user
    session = dynamodb_service.get_session(payload.session_id)
    if not session or session["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # 3. Pull recent conversation history for context
    history = dynamodb_service.get_conversation_history(payload.session_id)

    # 4. Call the LLM
    try:
        answer = get_llm_response(history, payload.question)
    except LLMError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))

    # 5. Persist both sides of the exchange
    dynamodb_service.create_message(payload.session_id, role="user", content=payload.question)
    dynamodb_service.create_message(payload.session_id, role="assistant", content=answer)

    return AskResponse(
        answer=answer,
        session_id=payload.session_id,
        timestamp=datetime.now(timezone.utc),
    )