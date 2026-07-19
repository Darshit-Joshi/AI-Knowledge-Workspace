# app/models/user.py
from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING :
    from app.models.workspace import Workspace

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Nullable for OAuth users
    provider: Mapped[str] = mapped_column(String(50), default="manual")              # "manual" or "google"
    
    # Leverages PostgreSQL's internal clock rather than Python application time
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Establish the top-level boundary. Deleting a user wipes their workspaces, 
    # which will sequentially trigger cascades to their documents, chats, and vectors.
    workspaces: Mapped[List["Workspace"]] = relationship(
        "Workspace", 
        back_populates="owner", 
        cascade="all, delete-orphan",
        lazy="selectin"  # Asynchronous-friendly loading strategy
    )