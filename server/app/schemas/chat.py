# app/schemas/chat.py
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field, ConfigDict
from app.models.chat import MessageRole

# --- Request Schemas ---

class ChatSessionCreate(BaseModel):
    title: str | None = Field(
        default="New Chat Conversation", 
        max_length=255, 
        examples=["RAG Architecture Discussion"]
    )

class ChatMessageCreate(BaseModel):
    content: str = Field(
        ..., 
        min_length=1, 
        examples=["Explain how cross-encoders work in hybrid search."]
    )

# --- Response Schemas ---

class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: MessageRole
    content: str
    citations: dict[str, Any] | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatSessionResponse(BaseModel):
    id: int
    title: str
    workspace_id: int
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageResponse] = []

    model_config = ConfigDict(from_attributes=True)