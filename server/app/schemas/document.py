# app/schemas/document.py
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl, ConfigDict
from app.models.document import SourceType, DocumentStatus

# --- Request Schemas ---

class WebIngestionRequest(BaseModel):
    url: HttpUrl = Field(..., description="Valid website or blog URL to scrape and ingest")
    title: str | None = Field(default=None, max_length=255, description="Optional custom title for the document")

class YouTubeIngestionRequest(BaseModel):
    url: HttpUrl = Field(..., description="Valid YouTube video URL to extract transcript from")
    title: str | None = Field(default=None, max_length=255, description="Optional custom title for the video")

# Note: PDF/DOCX uploads will be handled via FastAPI's UploadFile (multipart/form-data) in the API router, 
# so they do not require a Pydantic JSON request body schema.

# --- Response Schemas ---

class DocumentResponse(BaseModel):
    id: int
    title: str
    source_type: SourceType
    source_url_or_path: str
    status: DocumentStatus
    error_message: str | None
    workspace_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)