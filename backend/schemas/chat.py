from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, description="The question or prompt for the RAG system")
    thread_id: str = Field(..., description="The unique identifier for the conversation thread")