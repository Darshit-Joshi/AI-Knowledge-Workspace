from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import uuid4

class Chunk(BaseModel):

    id: str = Field(
        default_factory=lambda: str(uuid4())
    )

    document_id: str
    chunk_index: int
    text: str

    metadata: dict = Field(default_factory=dict)

    embedding: Optional[List[float]] = None