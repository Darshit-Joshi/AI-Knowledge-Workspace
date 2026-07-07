from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from agents.web_researcher import research_agent
from api.auth import get_current_user

router = APIRouter(
  prefix="/agents",
  tags=["AI Agents"]
)

class ResearchRequest(BaseModel):
  query: str
  
class ResearchResponse(BaseModel):
  answer: str
  queries_used : list[str]
  
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
  
