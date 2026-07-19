# app/models/document.py
import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, ForeignKey, DateTime, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.workspace import Workspace

class SourceType(str, enum.Enum):
    PDF = "PDF"
    DOCX = "DOCX"
    TXT = "TXT"
    MARKDOWN = "MARKDOWN"
    WEB = "WEB"
    YOUTUBE = "YOUTUBE"

class DocumentStatus(str, enum.Enum):
    PENDING = "PENDING"          # Uploaded, waiting in background queue
    PROCESSING = "PROCESSING"    # Chunking and generating embeddings
    COMPLETED = "COMPLETED"      # Ready for RAG search
    FAILED = "FAILED"            # Ingestion failed (e.g., corrupted file or paywalled URL)

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Enums ensure strict validation for source types and worker statuses
    source_type: Mapped[SourceType] = mapped_column(Enum(SourceType), nullable=False)
    source_url_or_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(Enum(DocumentStatus), default=DocumentStatus.PENDING, index=True)
    
    # Captures error tracebacks if background embedding fails, allowing UI error reporting
    error_message: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    
    # Foreign key linking directly to the workspace boundary
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="documents")