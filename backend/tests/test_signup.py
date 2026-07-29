import pytest
from fastapi import status
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app

client = TestClient(app)


@patch("app.db.dynamodb.dynamodb_service.get_user_by_email")
@patch("app.db.dynamodb.dynamodb_service.create_user")
def test_signup_success(mock_create_user, mock_get_user):
    mock_get_user.return_value = None
    mock_create_user.return_value = {
        "user_id": "new-user-id",
        "email": "newuser@test.edu",
        "name": "Student",
        "hashed_password": "hashedpassword123",
    }

    payload = {"email": "newuser@test.edu", "password": "securepass123"}
    response = client.post("/auth/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@patch("app.db.dynamodb.dynamodb_service.get_user_by_email")
def test_signup_duplicate_email(mock_get_user):
    mock_get_user.return_value = {
        "user_id": "existing-user-id",
        "email": "existing@test.edu",
    }

    payload = {"email": "existing@test.edu", "password": "securepass123"}
    response = client.post("/auth/register", json=payload)
    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json()["detail"] == "Email already registered"


def test_signup_short_password():
    payload = {"email": "short@test.edu", "password": "1234567"}
    response = client.post("/auth/register", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_signup_invalid_email():
    payload = {"email": "notanemail", "password": "securepass123"}
    response = client.post("/auth/register", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

