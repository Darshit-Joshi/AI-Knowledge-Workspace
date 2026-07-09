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
from ai.prompt.prompt_builder import PromptBuilder

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
        self.prompt_builder = PromptBuilder()

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

        prompt = self.prompt_builder.build(
    question=question,
    history=history_text,
    context=context
)

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