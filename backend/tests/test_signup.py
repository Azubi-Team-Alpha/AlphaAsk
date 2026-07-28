import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.database import Base, get_db
from app.db.models import User
from app.core.security import hash_password

from sqlalchemy.pool import StaticPool

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


def test_signup_success(client, db_session):
    payload = {"email": "newuser@test.edu", "password": "securepass123"}
    response = client.post("/auth/signup", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    user = db_session.query(User).filter(User.email == "newuser@test.edu").first()
    assert user is not None


def test_signup_duplicate_email(client, db_session):
    hashed = hash_password("testpass123")
    db_session.add(User(email="existing@test.edu", hashed_password=hashed))
    db_session.commit()

    payload = {"email": "existing@test.edu", "password": "securepass123"}
    response = client.post("/auth/signup", json=payload)
    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json()["detail"] == "Email already registered"


def test_signup_short_password(client):
    payload = {"email": "short@test.edu", "password": "1234567"}
    response = client.post("/auth/signup", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_signup_invalid_email(client):
    payload = {"email": "notanemail", "password": "securepass123"}
    response = client.post("/auth/signup", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
