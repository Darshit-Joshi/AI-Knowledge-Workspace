from pydantic import BaseModel, EmailStr , Field
from typing import Optional

class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)
  
class TokenResponse(BaseModel):
  access_token: str
  token_type: str = "bearer"
  user_email: str
  auth_provider : str
  
class ForgotPasswordRequest(BaseModel):
  email: EmailStr