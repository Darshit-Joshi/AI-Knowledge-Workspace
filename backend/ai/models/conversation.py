from pydantic import BaseModel
from pydantic import Field

from datetime import datetime
from uuid import uuid4


class Conversation(BaseModel):

    id: str = Field(
        default_factory=lambda: str(uuid4())
    )

    workspace_id: str

    title: str = "New Conversation"

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )