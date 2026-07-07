from pydantic import BaseModel
from typing import List


class RetrievedChunk(BaseModel):
    text: str
    score: float
    document_id: str
    chunk_index: int


class RetrievalResult(BaseModel):
    query: str
    chunks: List[RetrievedChunk]