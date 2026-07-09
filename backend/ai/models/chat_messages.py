
from pydantic import BaseModel
from pydantic import Field

from datetime import datetime
from uuid import uuid4


class ChatMessage(BaseModel):

    id: str = Field(
        default_factory=lambda: str(uuid4())
    )

    conversation_id: str

    role: str

    content: str

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )