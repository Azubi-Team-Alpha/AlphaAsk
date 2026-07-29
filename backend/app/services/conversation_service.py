from typing import List, Dict, Any
from app.db.dynamodb import dynamodb_service

MAX_HISTORY_MESSAGES = 10
MAX_HISTORY_TOKENS = 3000


def _estimate_tokens(text: str) -> int:
    return len(text) // 4


def get_conversation_history(session_id: str) -> List[Dict[str, Any]]:
    """Fetch recent message history for a session from DynamoDB."""
    items = dynamodb_service.get_conversation_history(session_id, limit=MAX_HISTORY_MESSAGES)
    
    trimmed = []
    total_tokens = 0
    for item in items:
        content = item.get("content", "")
        tokens = _estimate_tokens(content)
        if total_tokens + tokens > MAX_HISTORY_TOKENS:
            break
        trimmed.append({"role": item.get("role", "user"), "content": content})
        total_tokens += tokens

    return trimmed


def save_message(session_id: str, role: str, content: str) -> Dict[str, Any]:
    """Persist a message into DynamoDB."""
    return dynamodb_service.create_message(session_id, role, content)
