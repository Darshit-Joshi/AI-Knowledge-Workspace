from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for OAuth users
    provider = Column(String, default="manual")       # "manual" or "google"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))