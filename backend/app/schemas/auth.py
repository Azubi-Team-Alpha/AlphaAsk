from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str = "Student"
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


SignUpRequest = RegisterRequest


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    name: str = "Student"
    email: str = ""


class UserOut(BaseModel):
    id: UUID | str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)
