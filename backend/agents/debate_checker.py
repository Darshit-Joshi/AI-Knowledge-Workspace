import os 
import json
from typing import TypedDict, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_google_genai import ChatGoogleGenerativeAI

class DebateState(TypedDict):
  question: str
  draft_answer : str
  critique_history: list[str]
  revision_count: int
  is_approved: bool
  final_verified_answer : str
  
llm = ChatGoogleGenerativeAI(
  model="gemini-2.5-flash",
  temperature=0.3
  google_api_key = os.getenv("GEMINI_API_KEY")
)

search_tool = DuckDuckGoSearchRun()

def drafter_node(state:DebateState)  -> Dict[str,Any]:
  """ACTOR 1:the drafter Searches the web and generates or revises the answer based on critic feedback."""
  
  revision_no = state.get("revision_count",0)
  print(f"\n [DRAFTER] generating draft (Attempt {revision_no+1})")
  
  try:
    search_results = search_tool.invoke(state['question'])
  except:
    search_results = "Live search unavailale.Relying on internal reasoning"
    
    if revision_no == 0:
      prompt = f"""You are an expert Research Drafter. 
        Answer the user's question comprehensively using the live web search data below.
        
        USER QUESTION: {state['question']}
        WEB FACTS: {search_results}
        
        Provide a clear, highly structured, and well-cited response."""
    
    else:
      latest_critique = state['critique_history'][-1]
      prompt = f"""You are an expert Research Drafter. 
        Your previous draft was rejected by the Fact-Checking Critic. You MUST rewrite it to fix the errors.
        
        USER QUESTION: {state['question']}
        PREVIOUS DRAFT: {state['draft_answer']}
        CRITIC'S FEEDBACK: {latest_critique}
        ADDITIONAL WEB FACTS: {search_results}
        
        Write a corrected, rigorous, and factually airtight revision."""
        
    response = llm.invoke([HumanMessage(content=prompt)])
    
    return {
      "draft_answer": response.content,
      "revision_count":revision_no+1
    }
    
def critic_node(state:DebateState) -> Dict[str, Any]:
  """
    ACTOR 2: THE CRITIC
    Aggressively reviews the draft for hallucinations, missing context, or factual errors.
    """
  print(f"🔍 [CRITIC] Reviewing Draft Attempt {state['revision_count']} for accuracy...")
  
  try:
    verify_search = search_tool.invoke(f" fact check {state['question']}")
    
  except Exception:
    verify_search = ""
  
  prompt = f"""You are a ruthless Fact-Checking Critic. Your job is to ensure zero hallucinations.
    Evaluate the Drafter's answer against the verified facts.
    
    USER QUESTION: {state['question']}
    DRAFTER'S ANSWER: {state['draft_answer']}
    VERIFICATION SEARCH RESULTS: {verify_search}
    
    Respond STRICTLY in valid JSON format with exactly two keys:
    1. "approved": boolean (true if accurate and complete, false if flawed)
    2. "critique": string (detailed explanation of what is wrong, or "Looks airtight!" if approved)
    
    Example output: {{"approved": false, "critique": "You stated X, but verification shows Y."}}"""
    
  response = llm.invoke([HumanMessage(content=prompt)])
  
  try :
    clean_json = response.content.replace("```json", "").replace("```", "").strip()
    result = json.loads(clean_json)
    is_approved = result.get("approved", False)
    critique_text = result.get("critique", "No specific critique provided.")
  
  except Exception :
    is_approved = True
    critique_text ="Approved by default (JSON parse error in critic)."
    
  print(f"[CRITIC VERDICT]: {'APPROVED' if is_approved else 'REJECTED'} -> Note:{critique_text}")
  
  history = state.get("critique_history", [])
  history.append(critique_text)
  
  return {
        "is_approved": is_approved,
        "critique_history": history,
        "final_verified_answer": state["draft_answer"] if is_approved else ""
    } 
    
    
def debate_router_edge(state: DebateState) -> str:
    """
    Decides whether to loop back to the Drafter or terminate the debate.
    """
    # Max revisions set to 2 to prevent endless API spending and loops
    if state["is_approved"] or state["revision_count"] >= 2:
        print("🏁 Debate concluded. Routing to END.")
        return END
    
    print("🔄 Critique rejected the draft. Sending back to Drafter...")
    return "drafter"


workflow = StateGraph(DebateState)

workflow.add_node("drafter_node", drafter_node)
workflow.add_node("critic_node", critic_node)

workflow.set_entry_point("drafter_node")
workflow.add_edge("drafter_node","critic_node")

workflow.add_conditional_edges("critic",debate_router_edge, {"drafter_node":"drafter_node", END:END})

debate_agent = workflow.compile()

def run_debate_pipeline(question: str) -> Dict[str, Any]:
    """Helper function to execute the debate pipeline cleanly."""
    initial_state = {
        "question": question,
        "draft_answer": "",
        "critique_history": [],
        "revision_count": 0,
        "is_approved": False,
        "final_verified_answer": ""
    }
    final_state = debate_agent.invoke(initial_state)
    return {
        "verified_answer": final_state.get("final_verified_answer") or final_state.get("draft_answer"),
        "revisions_needed": final_state["revision_count"],
        "critique_trail": final_state["critique_history"]
    }