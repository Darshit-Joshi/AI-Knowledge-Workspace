# app/models/chat.py
import enum
from datetime import datetime
from typing import List, TYPE_CHECKING, Any
from sqlalchemy import String, ForeignKey, DateTime, Enum, Text, func, JSON  # <-- Added JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.workspace import Workspace

class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), default="New Chat Conversation")
    
    # Scopes this specific chat thread directly to a workspace
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="chat_sessions")
    
    # Keeping messages ordered by execution flow using an efficient join selection strategy
    messages: Mapped[List["Message"]] = relationship(
        "Message", 
        back_populates="session", 
        cascade="all, delete-orphan",
        order_by="Message.created_at.asc()",
        lazy="selectin"
    )

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("chat_sessions.id", ondelete="CASCADE"), index=True)
    
    # Enum handling message boundaries (e.g. system instructions, user queries, agent outputs)
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole), nullable=False)
    
    # Text type accommodates long-form agent multi-turn answers
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # ---> Fix: Passed JSON explicitly into mapped_column <---
    citations: Mapped[dict[str, Any] | None] = mapped_column(JSON, server_default="{}", nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session: Mapped["ChatSession"] = relationship("ChatSession", back_populates="messages")