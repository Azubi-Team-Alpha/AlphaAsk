# pyrefly: ignore [missing-import]
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture
def auth_headers():
    token = create_access_token(user_id="test-user-id")
    return {"Authorization": f"Bearer {token}"}


@patch("app.db.dynamodb.dynamodb_service.get_session")
@patch("app.db.dynamodb.dynamodb_service.get_session_messages")
def test_get_history_success(mock_get_messages, mock_get_session, auth_headers):
    mock_get_session.return_value = {
        "session_id": "test-session-id",
        "user_id": "test-user-id",
    }
    mock_get_messages.return_value = [
        {"role": "user", "content": "Hello", "created_at": "2026-07-29T12:00:00Z"},
        {"role": "assistant", "content": "Hi, how can I help you?", "created_at": "2026-07-29T12:00:01Z"},
    ]

    response = client.get("/history/test-session-id", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["session_id"] == "test-session-id"
    assert len(data["messages"]) == 2
    assert data["messages"][0]["role"] == "user"
    assert data["messages"][0]["content"] == "Hello"
    assert data["messages"][1]["role"] == "assistant"
    assert data["messages"][1]["content"] == "Hi, how can I help you?"


@patch("app.db.dynamodb.dynamodb_service.get_session")
def test_get_history_not_found(mock_get_session, auth_headers):
    mock_get_session.return_value = None
    response = client.get("/history/non-existent-session", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Session not found"


def test_get_history_unauthorized():
    response = client.get("/history/some-session-id")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_dynamodb_get_conversation_history_ordering():
    from app.db.dynamodb import dynamodb_service

    messages = [
        {"message_id": "1", "session_id": "s1", "role": "user", "content": "Q1", "created_at": "2026-08-06T10:00:00Z"},
        {"message_id": "2", "session_id": "s1", "role": "assistant", "content": "A1", "created_at": "2026-08-06T10:00:01Z"},
        {"message_id": "3", "session_id": "s1", "role": "user", "content": "Q2", "created_at": "2026-08-06T10:01:00Z"},
        {"message_id": "4", "session_id": "s1", "role": "assistant", "content": "A2", "created_at": "2026-08-06T10:01:01Z"},
    ]

    with patch.object(dynamodb_service, "get_session_messages", return_value=messages):
        history = dynamodb_service.get_conversation_history("s1", limit=2)
        assert len(history) == 2
        assert history[0]["content"] == "Q2"
        assert history[1]["content"] == "A2"


