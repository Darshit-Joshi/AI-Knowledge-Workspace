# app/services/memory_service.py
import logging
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage
from app.services.vector_service import vector_service
from app.core.config import settings
from langchain_openai import ChatOpenAI

logger = logging.getLogger(__name__)

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.1,  # Keep low temperature for factual extraction
    api_key=settings.OPENAI_API_KEY
)

class ExtractedMemoriesSchema(BaseModel):
    facts: list[str] = Field(
        ..., 
        description="List of atomic, standalone facts, user preferences, technical decisions, or project constraints established in the conversation."
    )

class MemoryService:
    async def extract_and_save_memories(
        self, 
        user_query: str, 
        assistant_response: str, 
        workspace_id: int, 
        session_id: int
    ):
        """Background worker that extracts durable facts and pushes them to Qdrant."""
        logger.info(f"🧠 [MEMORY] Analyzing exchange from session {session_id} for new memories...")
        
        prompt = f"""Analyze the following exchange between a User and an AI Assistant.
        Extract any permanent technical decisions, architectural constraints, user preferences, or established project facts that would be valuable to remember in future, separate chat sessions.
        
        USER: {user_query}
        ASSISTANT: {assistant_response}
        
        Rules:
        - Output ONLY atomic, standalone sentences (e.g., "The user finalized PostgreSQL as the database.", "The user prefers code examples in TypeScript.").
        - Do NOT extract transient chatter, greetings, or basic questions that don't establish a permanent fact.
        - If no durable facts or decisions were made, return an empty list."""
        
        try:
            structured_llm = llm.with_structured_output(ExtractedMemoriesSchema)
            result: ExtractedMemoriesSchema = await structured_llm.ainvoke([HumanMessage(content=prompt)])
            
            if result.facts:
                logger.info(f"💾 [MEMORY] Extracted facts: {result.facts}")
                await vector_service.store_memories(result.facts, workspace_id, session_id)
            else:
                logger.info("🧠 [MEMORY] No new durable facts detected in this turn.")
        except Exception as e:
            logger.error(f"❌ [MEMORY] Extraction worker failed: {e}")

memory_service = MemoryService()