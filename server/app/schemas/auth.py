# app/schemas/auth.py
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- Request Schemas (From Frontend to API) ---

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    token: str  # The Google OAuth ID token sent from the frontend client

# --- Response Schemas (From API to Frontend) ---

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    provider: str
    created_at: datetime | None=None

    # Modern Pydantic v2 replacement for orm_mode = True
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str | None = None  # Stores the user ID inside the decoded JWT
    exp: int | None = None