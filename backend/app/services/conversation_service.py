from sqlalchemy.orm import Session as DBSession
from app.db.models import Message

MAX_HISTORY_MESSAGES = 10
MAX_HISTORY_TOKENS = 3000


def _estimate_tokens(text: str) -> int:
    # Rough heuristic: ~4 characters per token for English text.
    # Good enough for budget trimming; not used for billing.
    return len(text) // 4


def get_conversation_history(db: DBSession, session_id) -> list[dict]:
    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at.desc())
        .limit(MAX_HISTORY_MESSAGES)
        .all()
    )
    messages.reverse()  # oldest first, so conversation reads in order

    trimmed = []
    total_tokens = 0
    # Walk from most recent backwards, keep what fits in the token budget
    for msg in reversed(messages):
        tokens = _estimate_tokens(msg.content)
        if total_tokens + tokens > MAX_HISTORY_TOKENS:
            break
        trimmed.insert(0, {"role": msg.role, "content": msg.content})
        total_tokens += tokens

    return trimmed


def save_message(db: DBSession, session_id, role: str, content: str) -> Message:
    message = Message(session_id=session_id, role=role, content=content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
