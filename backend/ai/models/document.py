from pydantic import BaseModel, Field
from datetime import datetime
from uuid import uuid4

from ai.models.source_type import SourceType

class Document(BaseModel):

    id: str = Field(default_factory=lambda: str(uuid4()))

    workspace_id: str

    source_type: SourceType

    title: str

    content: str

    metadata: dict = {}

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )