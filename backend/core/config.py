from pydantic_settings import BaseSettings

class Settings(BaseSettings):
  SECRET_KEY : str = "She_is_the_boss"
  ALGORITHM : str = "HS256"
  ACCESS_TOKEN_EXPIRE_MINUTES :int = 60
  
  GOOGLE_CLIENT_ID : str = ""
  GOOGLE_CLIENT_SECRET : str = ""
  GOOGLE_REDIRECT_URI : str = "http://localhost:8000/auth/google/callback"
  
  DATABASE_URL: str = ""
  QDRANT_URL: str = "http://localhost:6333"
  QDRANT_API_KEY: str = ""
  
  
  class Config:
    env_file = ".env"
    extra ="ignore"
    
settings = Settings()