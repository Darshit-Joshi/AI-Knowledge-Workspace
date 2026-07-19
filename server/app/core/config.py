# app/core/config.py
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Security & JWT
    SECRET_KEY: str = Field(default="She_is_the_boss")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    
    # OAuth Settings (Defaults to empty strings if not in .env)
    GOOGLE_CLIENT_ID: str = Field(default="")
    GOOGLE_CLIENT_SECRET: str = Field(default="")
    GOOGLE_REDIRECT_URI: str = Field(default="http://localhost:8000/auth/google/callback")
    
    # Infrastructure Settings (Database & Vectors)
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:password@localhost:5432/ai_workspace"
    )
    QDRANT_URL: str = Field(default="http://localhost:6333")
    QDRANT_API_KEY: str = Field(default="")
    QDRANT_COLLECTION_NAME: str = Field(default="knowledge_workspaces")
    
    # AI Providers
    OPENAI_API_KEY: str = Field(default="")
    GEMINI_API_KEY: str = Field(default="")  # Good practice to keep just in case!
    
    # Modern Pydantic v2 configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",  # Ensures clean reading of special chars/passwords
        extra="ignore",             # Ignores extra env vars (like old SENTRY_DSN or system vars)
        case_sensitive=True         # Matches exact casing in .env
    )

# Global singleton instance exported for the application
settings = Settings()