from pydantic import BaseModel

class EmbeddedChunk(BaseModel):

    chunk_id: str

    document_id: str

    embedding: list[float]

    text: str

    metadata: dict