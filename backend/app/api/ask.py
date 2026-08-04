import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone

from app.db.dynamodb import dynamodb_service
from app.core.deps import get_current_user
from app.schemas.ask import AskRequest, AskResponse
from app.services.llm_services import get_llm_response, stream_llm_response, LLMError
from app.core.rate_limit import enforce_rate_limit

router = APIRouter(tags=["ask"])


@router.post("/ask", response_model=AskResponse)
def ask(
    payload: AskRequest,
    current_user: dict = Depends(get_current_user),
):
    # 1. Rate limit check (Redis)
    enforce_rate_limit(user_id=current_user["user_id"])

    session_id = str(payload.session_id)

    # 2. Confirm the session belongs to this user
    session = dynamodb_service.get_session(session_id)
    if not session or session["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # 3. Pull recent conversation history for context
    history = dynamodb_service.get_conversation_history(session_id)

    # 4. Call the LLM
    try:
        answer = get_llm_response(history, payload.question, payload.document_context, payload.subject, payload.rag_mode)
    except LLMError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))

    # 5. Persist both sides of the exchange
    user_msg = dynamodb_service.create_message(session_id, role="user", content=payload.question)
    dynamodb_service.create_message(session_id, role="assistant", content=answer)

    # 6. Write to Questions table for fast user-scoped lookup
    dynamodb_service.create_question_record(
        user_id=current_user["user_id"],
        session_id=session_id,
        message_id=user_msg["message_id"],
        question=payload.question,
        answer=answer,
    )

    return AskResponse(
        answer=answer,
        session_id=session_id,
        timestamp=datetime.now(timezone.utc),
    )


@router.post("/ask/stream")
def ask_stream(
    payload: AskRequest,
    current_user: dict = Depends(get_current_user),
):
    # 1. Rate limit check (Redis)
    enforce_rate_limit(user_id=current_user["user_id"])

    session_id = str(payload.session_id)

    # 2. Confirm session ownership
    session = dynamodb_service.get_session(session_id)
    if not session or session["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # 3. History — pull before persisting so the new message isn't included in context
    history = dynamodb_service.get_conversation_history(session_id)

    # 4. Persist user message before streaming starts and capture its ID
    user_msg = dynamodb_service.create_message(session_id, role="user", content=payload.question)
    user_msg_id = user_msg["message_id"]

    def event_generator():
        accumulated_answer = ""
        try:
            for sse_event in stream_llm_response(history, payload.question, payload.document_context, payload.subject, payload.rag_mode):
                # Extract chunk to accumulate for persistence
                if sse_event.startswith("data: "):
                    try:
                        chunk_obj = json.loads(sse_event[6:].strip())
                        accumulated_answer += chunk_obj.get("content", "")
                    except Exception:
                        pass
                yield sse_event

            # Persist assistant response and question record upon completion
            if accumulated_answer.strip():
                dynamodb_service.create_message(session_id, role="assistant", content=accumulated_answer.strip())
                dynamodb_service.create_question_record(
                    user_id=current_user["user_id"],
                    session_id=session_id,
                    message_id=user_msg_id,
                    question=payload.question,
                    answer=accumulated_answer.strip(),
                )
        except LLMError as e:
            err_data = json.dumps({"error": str(e)})
            yield f"data: {err_data}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")