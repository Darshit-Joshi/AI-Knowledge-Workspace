# app/api/v1/chat.py
import json
import logging
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.services.memory_service import memory_service
from app.core.database import get_db, AsyncSessionLocal
from app.models.user import User
from app.models.workspace import Workspace
from app.models.chat import ChatSession, Message, MessageRole
from app.schemas.chat import (
    ChatSessionCreate, 
    ChatSessionResponse, 
    ChatMessageCreate, 
    ChatMessageResponse
)
from app.api.v1.auth import get_current_user

# ---> IMPORT THE REAL CHAT & DEBATE LANGGRAPH ENGINE <---
from app.orchestration.agent_team import chat_agent_graph

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/workspaces/{workspace_id}/chats", tags=["Chat & Agents"])

async def verify_workspace_access(workspace_id: int, user_id: int, db: AsyncSession) -> Workspace:
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == user_id)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found or access denied.")
    return workspace

@router.post("", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    workspace_id: int,
    session_in: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_workspace_access(workspace_id, current_user.id, db)
    session = ChatSession(
        title=session_in.title or "New Chat Conversation",
        workspace_id=workspace_id
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

@router.get("", response_model=list[ChatSessionResponse])
async def list_chat_sessions(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_workspace_access(workspace_id, current_user.id, db)
    result = await db.execute(
        select(ChatSession).where(ChatSession.workspace_id == workspace_id).order_by(ChatSession.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session_history(
    workspace_id: int,
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_workspace_access(workspace_id, current_user.id, db)
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == session_id, ChatSession.workspace_id == workspace_id)
        .options(selectinload(ChatSession.messages))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")
    return session

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_session(
    workspace_id: int,
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_workspace_access(workspace_id, current_user.id, db)
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.workspace_id == workspace_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")
    await db.delete(session)
    await db.commit()
    return None

# --- Real-Time LangGraph SSE Streaming Engine ---

async def live_agent_stream_generator(
    user_query: str, 
    workspace_id: int,
    session_id: int,
    background_tasks : BackgroundTasks
) -> AsyncGenerator[str, None]:
    """
    Executes the live LangGraph Actor-Critic RAG engine and yields formatted 
    Server-Sent Events (SSE) directly to your React frontend.
    """
    initial_state = {
        "question": user_query,
        "workspace_id": workspace_id,
        "expanded_queries": [],
        "retrieved_context": "",
        "draft_answer": "",
        "critique_history": [],
        "revision_count": 0,
        "is_approved": False,
        "final_answer": "",
        "citations": {}
    }
    
    final_output_text = ""
    citations_data = {}

    try:
        # Step 1: Yield initial status
        status_msg = json.dumps({"type": "status", "node": "query_expander", "message": "Expanding query into search vectors..."})
        yield f"data: {status_msg}\n\n"

        # Step 2: Iterate over LangGraph node updates as they finish
        async for state_update in chat_agent_graph.astream(initial_state):
            for node_name, updated_state in state_update.items():
                
                if node_name == "query_expander":
                    queries = updated_state.get("expanded_queries", [])
                    status_msg = json.dumps({"type": "status", "node": "retriever", "message": f"Searching Qdrant across {len(queries)} vectors..."})
                    yield f"data: {status_msg}\n\n"
                    
                elif node_name == "workspace_retriever":
                    citations_data = updated_state.get("citations", {})
                    if citations_data:
                        yield f"data: {json.dumps({'type': 'citations', 'content': citations_data})}\n\n"
                    status_msg = json.dumps({"type": "status", "node": "drafter", "message": "Synthesizing draft from retrieved context..."})
                    yield f"data: {status_msg}\n\n"
                    
                elif node_name == "drafter":
                    rev = updated_state.get("revision_count", 1)
                    status_msg = json.dumps({"type": "status", "node": "critic", "message": f"Fact-checking draft (Attempt {rev}) against sources..."})
                    yield f"data: {status_msg}\n\n"
                    
                elif node_name == "critic":
                    approved = updated_state.get("is_approved", False)
                    final_output_text = updated_state.get("final_answer") or updated_state.get("draft_answer", "")
                    if not approved:
                        status_msg = json.dumps({"type": "status", "node": "drafter", "message": "Critique flagged unverified claims. Re-drafting..."})
                        yield f"data: {status_msg}\n\n"

        # Step 3: Stream the verified final answer token-by-token for a smooth UI experience
        if final_output_text:
            words = final_output_text.split(" ")
            for i, word in enumerate(words):
                content = word + " " if i < len(words) - 1 else word
                yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"

        # Step 4: Persist assistant response cleanly into PostgreSQL using an isolated session
        async with AsyncSessionLocal() as db:
            assistant_msg = Message(
                session_id=session_id,
                role=MessageRole.ASSISTANT,
                content=final_output_text,
                citations=citations_data
            )
            db.add(assistant_msg)
            await db.commit()
            
            background_tasks.add_task(
                memory_service.extract_and_save_memories,
                user_query=user_query,
                assistant_response=final_output_text,
                workspace_id=workspace_id,
                session_id=session_id
            )

    except Exception as e:
        logger.error(f"❌ Error during agent streaming: {str(e)}")
        err_payload = json.dumps({"type": "token", "content": f"\n\n[System Error: Agent execution halted: {str(e)}]"})
        yield f"data: {err_payload}\n\n"
        
    finally:
        # Step 5: Terminate the Event-Stream cleanly
        yield "data: [DONE]\n\n"

@router.post("/{session_id}/stream")
async def stream_agent_chat(
    workspace_id: int,
    session_id: int,
    message_in: ChatMessageCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_workspace_access(workspace_id, current_user.id, db)
    
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.workspace_id == workspace_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")
        
    # Persist user message immediately
    user_msg = Message(
        session_id=session_id,
        role=MessageRole.USER,
        content=message_in.content
    )
    db.add(user_msg)
    await db.commit()
    
    return StreamingResponse(
        live_agent_stream_generator(message_in.content, workspace_id, session_id, background_tasks),
        media_type="text/event-stream"
    )