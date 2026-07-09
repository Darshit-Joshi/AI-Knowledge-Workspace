from openai import OpenAI
from dotenv import load_dotenv
import os

from ai.retrieval.retriever import Retriever

from ai.models.chat_response import (
    ChatResponse,
    Source
)

from ai.repositories.conversation_repository import (
    ConversationRepository
)

from ai.memory.conversation_memory import (
    ConversationMemory
)

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


class RAGService:

    def __init__(self):

        self.retriever = Retriever()

        self.conversation_repository = (
            ConversationRepository()
        )

        self.conversation_memory = (
            ConversationMemory(
                repository=self.conversation_repository
            )
        )

    def answer_question(
        self,
        workspace_id: str,
        conversation_id: str,
        question: str,
        k: int = 5
    ) -> ChatResponse:

        # --------------------------------------------------
        # Save user message
        # --------------------------------------------------

        self.conversation_memory.add_user_message(
            conversation_id=conversation_id,
            content=question
        )

        # --------------------------------------------------
        # Load conversation history
        # --------------------------------------------------

        history_text = (
            self.conversation_memory.format_history(
                conversation_id=conversation_id,
                limit=10
            )
        )

        # --------------------------------------------------
        # Build retrieval query
        # --------------------------------------------------

        retrieval_query = f"""
Conversation History:
{history_text}

Current Question:
{question}
"""

        # --------------------------------------------------
        # Retrieve relevant chunks
        # --------------------------------------------------

        retrieval_result = self.retriever.retrieve(
            query=retrieval_query,
            k=k
        )

        # Future version:
        #
        # retrieval_result = self.retriever.retrieve(
        #     workspace_id=workspace_id,
        #     query=retrieval_query,
        #     k=k
        # )

        # --------------------------------------------------
        # Build context
        # --------------------------------------------------

        context = "\n\n".join(
            chunk.text
            for chunk in retrieval_result.chunks
        )

        # --------------------------------------------------
        # Build prompt
        # --------------------------------------------------

        prompt = f"""
You are an AI Knowledge Workspace assistant.

You answer questions using ONLY the
provided knowledge base context.

Rules:

1. Use ONLY the supplied context.
2. Never invent facts.
3. If information is unavailable, say:
   "I could not find that information in the uploaded knowledge base."
4. Use conversation history to resolve references such as:
   - it
   - they
   - that
   - those
5. Provide a clear and concise answer.
6. If multiple sources support the answer,
   synthesize them.

Conversation History:
{history_text}

Knowledge Base Context:
{context}

Question:
{question}
"""

        # --------------------------------------------------
        # Generate response
        # --------------------------------------------------

        response = client.responses.create(
            model="gpt-5-mini",
            input=prompt
        )

        answer = response.output_text

        # --------------------------------------------------
        # Save assistant message
        # --------------------------------------------------

        self.conversation_memory.add_assistant_message(
            conversation_id=conversation_id,
            content=answer
        )

        # --------------------------------------------------
        # Build sources
        # --------------------------------------------------

        sources = [
            Source(
                document_id=chunk.document_id,
                chunk_index=chunk.chunk_index
            )
            for chunk in retrieval_result.chunks
        ]

        # --------------------------------------------------
        # Return response
        # --------------------------------------------------

        return ChatResponse(
            answer=answer,
            sources=sources
        )