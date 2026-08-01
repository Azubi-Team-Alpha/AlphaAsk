import pytest
from fastapi import status
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture
def auth_headers():
    token = create_access_token(user_id="test-user-id")
    return {"Authorization": f"Bearer {token}"}


@patch("app.api.ask.enforce_rate_limit")
@patch("app.api.ask.get_llm_response")
@patch("app.db.dynamodb.dynamodb_service.get_session")
@patch("app.db.dynamodb.dynamodb_service.get_conversation_history")
@patch("app.db.dynamodb.dynamodb_service.create_message")
@patch("app.db.dynamodb.dynamodb_service.create_question_record")
def test_ask_endpoint_success(
    mock_create_q,
    mock_create_msg,
    mock_history,
    mock_get_session,
    mock_get_llm,
    mock_rate_limit,
    auth_headers,
):
    mock_rate_limit.return_value = None
    mock_get_llm.return_value = "This is a response from the LLM model."
    mock_get_session.return_value = {
        "session_id": "test-session-id",
        "user_id": "test-user-id",
    }
    mock_history.return_value = []
    mock_create_msg.return_value = {"message_id": "test-msg-id"}
    mock_create_q.return_value = None

    payload = {
        "question": "What is clean code?",
        "session_id": "test-session-id",
    }
    response = client.post("/ask", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["answer"] == "This is a response from the LLM model."
    assert data["session_id"] == "test-session-id"


@patch("app.api.ask.enforce_rate_limit")
@patch("app.db.dynamodb.dynamodb_service.get_session")
def test_ask_endpoint_missing_session(mock_get_session, mock_rate_limit, auth_headers):
    mock_rate_limit.return_value = None
    mock_get_session.return_value = None

    payload = {
        "question": "What is clean code?",
        "session_id": "non-existent-session-id",
    }
    response = client.post("/ask", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Session not found"


def test_ask_endpoint_unauthorized():
    payload = {
        "question": "What is clean code?",
        "session_id": "some-session-id",
    }
    response = client.post("/ask", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

