from fastapi import APIRouter, HTTPException, Depends,BackgroundTasks
from pydantic import BaseModel
from agents.web_researcher import research_agent
from api.auth import get_current_user
from typing import List,Optional
from datetime import datetime
from agents.report_generator import report_generation_agent
from agents.debate_checker import run_debate_pipeline

router = APIRouter(
  prefix="/agents",
  tags=["AI Agents"]
)

class ResearchRequest(BaseModel):
  query: str
  
class ResearchResponse(BaseModel):
  answer: str
  queries_used : list[str]
  
class DebateRequest(BaseModel):
    query: str

class DebateResponse(BaseModel):
    verified_answer: str
    revisions_needed: int
    critique_trail: List[str]
    
class ReportRequest(BaseModel):
    topic: str

class ReportAsyncStatusResponse(BaseModel):
    message: str
    topic: str
    status: str
    timestamp: str
    

def execute_async_report_generation(topic: str, user_email: str):
    """
    Synchronous worker executed in a background execution thread.
    Compiles the report and handles future DB writes without hanging the API.
    """
    try:
        initial_state = {
            "topic": topic,
            "outline": [],
            "current_section_idx": 0,
            "completed_sections": {},
            "final_report_markdown": ""
        }
        # Run the full multi-agent compiled graph
        final_state = report_generation_agent.invoke(initial_state)
        
        # Access the complete artifact
        generated_doc = final_state["final_report_markdown"]
        
        # 💡 PLACEHOLDER FOR LATER POSTGRES INTEGRATION:
        # Once your teammate completes the core DB model, we will write:
        # db_report = Report(title=f"Report: {topic}", content_markdown=generated_doc, user_email=user_email)
        # db.add(db_report)...
        print(f"\n💾 [DATABASE WORKER] Report successfully generated and cached for {user_email}!")
        print(f"📄 Sample Output Preview:\n{generated_doc[:250]}...")
        
    except Exception as e:
        print(f"❌ [BACKGROUND ERROR] Asynchronous Agent crashed: {str(e)}")
        


@router.post('/research', response_model = ResearchResponse)
async def run_web_researcher(request: ResearchRequest, current_user: dict = Depends(get_current_user)):
  if not request.query.strip() :
    raise HTTPException(status_code=400, detail="Query cant be empty")
  
  try:
    initial_state = {"question": request.query, "search_queries":[], "research_findings":"", "final_answer":""}
    final_state= research_agent.invoke(initial_state)
    return ResearchResponse(
      answer= final_state["final_answer"],
      queries_used=final_state["search_queries"]
    )
    
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Agent crashed : {str(e)}")
  
  
@router.post("/debate", response_model=DebateResponse)
async def trigger_fact_checking_debate(
    request: DebateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Protected endpoint: Pits a Drafter Agent against a Critic Agent in a loop
    until the answer is rigorously verified and free of hallucinations.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        result = run_debate_pipeline(request.query)
        return DebateResponse(
            verified_answer=result["verified_answer"],
            revisions_needed=result["revisions_needed"],
            critique_trail=result["critique_trail"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Debate pipeline failed: {str(e)}")
           
      
@router.post("/generate-report", response_model=ReportAsyncStatusResponse)
async def trigger_deep_dive_report(
    request: ReportRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Asynchronously registers a long-form multi-agent research generation task.
    Responds immediately to avoid gateway network processing timeouts.
    """
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Report topic cannot be empty.")

    # Queue the heavy graph run onto FastAPI's worker threads
    background_tasks.add_task(
        execute_async_report_generation, 
        topic=request.topic, 
        user_email=current_user["email"]
    )

    return ReportAsyncStatusResponse(
        message="Deep-dive report generation started successfully in the background.",
        topic=request.topic,
        status="processing",
        timestamp=datetime.utcnow().isoformat()
    )
    
    