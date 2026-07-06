from pydantic_settings import BaseSettings

class Settings(BaseSettings):
  SECRET_KEY : str = "secret"
  ALGORITHM : str = "HS256"
  ACCESS_TOKEN_EXPIRE_MINUTES :int = 60
  
  GOOGLE_CLIENT_ID : str = ""
  GOOGLE_CLIENT_SECRET : str = ""
  GOOGLE_REDIRECT_URI : str = "http://localhost:8000/auth/google/callback"
  
  class Config:
    env_file = ".env"
    
settings = Settings()