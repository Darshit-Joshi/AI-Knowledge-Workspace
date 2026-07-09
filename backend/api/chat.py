import json
import uuid
from typing import AsyncGenerator, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage

# Import our master supervisor or debate agent
from agents.web_researcher import research_agent
from api.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["Real-Time Streaming Chat"])

class StreamChatRequest(BaseModel):
    query: str
    thread_id: Optional[str] = None  # This is how we maintain Redux-style context across turns!

async def agent_token_generator(query: str, thread_id: str) -> AsyncGenerator[str, None]:
    """
    An asynchronous generator that listens to LangGraph runtime events.
    Whenever the LLM outputs a token, we wrap it in a Server-Sent Event (SSE)
    and push it across the network to the React frontend immediately.
    """
    # Define initial state payload
    initial_state = {
        "question": query,
        "search_queries": [],
        "research_findings": "",
        "final_answer": ""
    }
    
    # LangGraph Config object binds this run to a specific memory thread
    config = {"configurable": {"thread_id": thread_id}}
    
    try:
        # 1. Yield an opening event to tell the frontend UI the stream has initiated
        yield f"data: {json.dumps({'event': 'start', 'thread_id': thread_id})}\n\n"
        
        # 2. Use LangGraph v2 astream_events to intercept token emissions in real-time
        async for event in research_agent.astream_events(initial_state, config=config, version="v2"):
            event_type = event.get("event")
            
            # Catch when the LLM is actively typing out words
            if event_type == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if chunk.content:
                    # Package token as standard SSE data: {"token": "hello"}\n\n
                    payload = json.dumps({"event": "token", "data": chunk.content})
                    yield f"data: {payload}\n\n"
                    
            # Catch when an agent changes nodes (e.g., from 'Thinking' to 'Searching Web')
            elif event_type == "on_chain_start":
                node_name = event.get("name", "")
                if node_name in ["generate_queries", "web_search", "synthesize_answer"]:
                    status_payload = json.dumps({"event": "status", "data": f"Agent working on: {node_name}..."})
                    yield f"data: {status_payload}\n\n"

        # 3. Yield a standard completion signal so the React EventSource knows to close
        yield f"data: {json.dumps({'event': 'done'})}\n\n"
        
    except Exception as e:
        error_payload = json.dumps({"event": "error", "data": f"Stream interrupted: {str(e)}"})
        yield f"data: {error_payload}\n\n"
        yield f"data: {json.dumps({'event': 'done'})}\n\n"


@router.post("/stream")
async def stream_agent_conversation(
    request: StreamChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Protected streaming route. Returns a text/event-stream response class.
    Your React frontend can consume this using the native `EventSource` API or `@microsoft/fetch-event-source`.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    # If the frontend didn't pass a thread_id, generate a new conversation UUID
    conversation_id = request.thread_id or str(uuid.uuid4())
    
    # Return FastAPI's StreamingResponse with strict MIME type for Server-Sent Events
    return StreamingResponse(
        agent_token_generator(query=request.query, thread_id=conversation_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Prevents Nginx/Docker from buffering streaming tokens!
        }
    )