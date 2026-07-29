import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_faq_endpoint():
    response = client.get("/FAQ")
    assert response.status_code == 200
    faqs = response.json()
    assert isinstance(faqs, list)
    assert len(faqs) > 0
    assert "question" in faqs[0]
    assert "answer" in faqs[0]


@patch("app.db.dynamodb.dynamodb_service.get_user_by_email")
@patch("app.db.dynamodb.dynamodb_service.create_user")
def test_register_flow(mock_create_user, mock_get_user_by_email):
    mock_get_user_by_email.return_value = None
    mock_create_user.return_value = {
        "user_id": "test-uuid-1234",
        "email": "teststudent@example.com",
        "name": "Test Student",
        "hashed_password": "hashedpassword123",
    }

    response = client.post(
        "/auth/register",
        json={
            "name": "Test Student",
            "email": "teststudent@example.com",
            "password": "SecretPassword123!",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["name"] == "Test Student"
    assert data["email"] == "teststudent@example.com"
