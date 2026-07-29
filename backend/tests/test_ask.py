import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

from app.main import app
from app.db.database import Base, get_db
from app.db.models import User, Session as ChatSession, Message
from app.core.security import hash_password, create_access_token
from unittest.mock import patch

from sqlalchemy.pool import StaticPool

# Setup SQLite in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers(db_session):
    # Create a test user
    hashed = hash_password("testpassword123")
    user = User(email="student@university.edu", hashed_password=hashed)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Generate token
    token = create_access_token(user_id=str(user.id))
    return {"Authorization": f"Bearer {token}"}

@patch("app.api.ask.enforce_rate_limit")
@patch("app.api.ask.get_llm_response")
def test_ask_endpoint_success(mock_get_llm, mock_rate_limit, client, db_session, auth_headers):
    # Setup mocks
    mock_get_llm.return_value = "This is a response from the LLM model."
    mock_rate_limit.return_value = None

    # First create a chat session
    response = client.post("/sessions", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    session_id = response.json()["session_id"]

    # Submit a question
    payload = {
        "question": "What is clean code?",
        "session_id": session_id
    }
    response = client.post("/ask", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["answer"] == "This is a response from the LLM model."
    assert data["session_id"] == session_id

    # Check if messages were persisted in database
    db_messages = db_session.query(Message).filter(Message.session_id == uuid.UUID(session_id)).all()
    assert len(db_messages) == 2
    assert db_messages[0].role == "user"
    assert db_messages[0].content == "What is clean code?"
    assert db_messages[1].role == "assistant"
    assert db_messages[1].content == "This is a response from the LLM model."

@patch("app.api.ask.enforce_rate_limit")
def test_ask_endpoint_missing_session(mock_rate_limit, client, auth_headers):
    mock_rate_limit.return_value = None
    payload = {
        "question": "What is clean code?",
        "session_id": str(uuid.uuid4())
    }
    response = client.post("/ask", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Session not found"

def test_ask_endpoint_unauthorized(client):
    payload = {
        "question": "What is clean code?",
        "session_id": str(uuid.uuid4())
    }
    response = client.post("/ask", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
