from pydantic import BaseModel
from typing import List


class Source(BaseModel):
    document_id: str
    chunk_index: int


class ChatResponse(BaseModel):
    answer: str
    sources: List[Source]