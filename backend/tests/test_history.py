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

def test_get_history_success(client, db_session, auth_headers):
    # First get user id
    user = db_session.query(User).filter(User.email == "student@university.edu").first()

    # Create a chat session manually
    session = ChatSession(user_id=user.id)
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    # Save mock messages
    msg1 = Message(session_id=session.id, role="user", content="Hello")
    msg2 = Message(session_id=session.id, role="assistant", content="Hi, how can I help you?")
    db_session.add_all([msg1, msg2])
    db_session.commit()

    # Call endpoint
    response = client.get(f"/history/{session.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["session_id"] == str(session.id)
    assert len(data["messages"]) == 2
    assert data["messages"][0]["role"] == "user"
    assert data["messages"][0]["content"] == "Hello"
    assert data["messages"][1]["role"] == "assistant"
    assert data["messages"][1]["content"] == "Hi, how can I help you?"

def test_get_history_not_found(client, auth_headers):
    random_uuid = str(uuid.uuid4())
    response = client.get(f"/history/{random_uuid}", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Session not found"

def test_get_history_unauthorized(client):
    random_uuid = str(uuid.uuid4())
    response = client.get(f"/history/{random_uuid}")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
