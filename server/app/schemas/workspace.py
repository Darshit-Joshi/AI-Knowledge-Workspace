# app/schemas/workspace.py
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# --- Request Schemas ---

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, examples=["GenAI Research"])
    description: str | None = Field(default=None, max_length=1024, examples=["Notes and papers on RAG and Agentic AI"])

class WorkspaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1024)

# --- Response Schemas ---

class WorkspaceResponse(BaseModel):
    id: int
    name: str
    description: str | None
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)