# app/schemas/report.py
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.report import ReportStatus

# --- Request Schemas ---

class ReportGenerateRequest(BaseModel):
    title: str = Field(
        ..., 
        min_length=1, 
        max_length=255, 
        examples=["Deep Research: Agentic RAG Systems"]
    )
    prompt: str = Field(
        ..., 
        min_length=5, 
        examples=["Compare LangGraph and standard LangChain pipelines based on uploaded research papers."]
    )

# --- Response Schemas ---

class ReportResponse(BaseModel):
    id: int
    title: str
    content: str
    status: ReportStatus
    workspace_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)