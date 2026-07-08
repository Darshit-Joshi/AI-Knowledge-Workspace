from openai import OpenAI
from dotenv import load_dotenv
import os

from ai.retrieval.retriever import Retriever
from ai.models.chat_response import (
    ChatResponse,
    Source
)

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


class RAGService:

    def __init__(self):
        self.retriever = Retriever()

    def answer_question(
        self,
        question: str,
        k: int = 5
    ) -> ChatResponse:

        retrieval_result = self.retriever.retrieve(
            query=question,
            k=k
        )

        context = "\n\n".join(
            chunk.text
            for chunk in retrieval_result.chunks
        )

        prompt = f"""
You are a helpful AI assistant.

Answer the user's question using only the provided context.

If the answer is not present in the context,
say that the information could not be found.

Context:
{context}

Question:
{question}
"""

        response = client.responses.create(
            model="gpt-5-mini",
            input=prompt
        )

        sources = [
            Source(
                document_id=chunk.document_id,
                chunk_index=chunk.chunk_index
            )
            for chunk in retrieval_result.chunks
        ]

        return ChatResponse(
            answer=response.output_text,
            sources=sources
        )

