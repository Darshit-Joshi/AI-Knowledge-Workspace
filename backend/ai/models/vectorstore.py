from pydantic import BaseModel
from typing import List

class VectorRecord(BaseModel):
    id: str
    document_id: str
    text: str
    embedding: List[float]
    metadata: dict