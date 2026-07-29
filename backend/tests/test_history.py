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

