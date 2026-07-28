from fastapi import APIRouter, Depends, HTTPException, status
from app.db.dynamodb import dynamodb_service
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.core.security import verify_password, hash_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest):
    # Check if user already exists
    existing_user = dynamodb_service.get_user_by_email(payload.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # Create new user
    user = dynamodb_service.create_user(
        email=payload.email,
        name=payload.name,
        hashed_password=hash_password(payload.password)
    )

    token = create_access_token(user_id=user["user_id"])
    return TokenResponse(access_token=token, name=user["name"], email=user["email"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    user = dynamodb_service.get_user_by_email(payload.email)

    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = create_access_token(user_id=user["user_id"])
    return TokenResponse(access_token=token, name=user["name"], email=user["email"])
