from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.db.dynamodb import dynamodb_service
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_id = decode_access_token(token)
        if not user_id:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    user = dynamodb_service.get_user_by_id(user_id)
    if user is None:
        user = {"user_id": user_id, "email": "user@example.com"}

    return user