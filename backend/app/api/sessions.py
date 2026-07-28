from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session as DBSession
from app.db.database import get_db
from app.db.models import User
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: DBSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_id = decode_access_token(token)
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from app.db.database import get_db
from app.db.models import Session as ChatSession, User
from app.core.deps import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("")
def create_session(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_session = ChatSession(user_id=current_user.id)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return {"session_id": str(new_session.id)}