# app/models/workspace.py
from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

# TYPE_CHECKING prevents circular import errors at runtime while preserving IDE autocompletion
if TYPE_CHECKING:
    from app.models.user import User
    from app.models.document import Document
    from app.models.chat import ChatSession

class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    
    # ForeignKey ensures every workspace must belong to a valid user. 
    # ondelete="CASCADE" ensures deleting a user account cleanly wipes their workspaces.
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="workspaces")
    
    # Deleting a workspace will automatically wipe all associated documents and chat logs
    documents: Mapped[List["Document"]] = relationship(
        "Document", 
        back_populates="workspace", 
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    
    chat_sessions: Mapped[List["ChatSession"]] = relationship(
        "ChatSession", 
        back_populates="workspace", 
        cascade="all, delete-orphan",
        lazy="selectin"
    )