# app/models/report.py
import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, ForeignKey, DateTime, Enum, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.workspace import Workspace

class ReportStatus(str, enum.Enum):
    GENERATING = "GENERATING"    # Report agent is actively compiling findings
    COMPLETED = "COMPLETED"      # Report is ready for viewing/export
    FAILED = "FAILED"            # Agent failed during generation

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Text column allows storing large Markdown or structured HTML outputs from the Report Agent
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    status: Mapped[ReportStatus] = mapped_column(Enum(ReportStatus), default=ReportStatus.GENERATING)
    
    # Ties the report strictly to the workspace knowledge base used to generate it
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace")