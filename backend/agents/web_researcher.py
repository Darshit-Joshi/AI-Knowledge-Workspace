import os
import json
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.tools import DuckDuckGoSearchRun

class ResearchState(TypedDict):
  question:str
  search_queries : List[str]
  research_findings : str
  final_answer : str
  
llm = ChatGoogleGenerativeAI(
  model="gemini-2.5-flash",
  temperature = 0.6,
  google_api_key = os.getenv("GEMINI_API_KEY")
)

search_tool = DuckDuckGoSearchRun()

def generate_queries_node(state: ResearchState):
  """Step 1: the AI thinks of best search queries to Google"""
  print("Thinking of search queries")
  
  prompt = f""" You are an expert researchers. The user wants to know "{state['question']}"   
  Generate exactly 3 specific Google search queries that would help answer this question.
    Return ONLY a valid JSON list of strings. Example: ["query 1", "query 2", "query 3"]
  """
  response = llm.invoke([HumanMessage(content=prompt)])
  
  try :
    clean_json = response.content.replace("```json", "").replace("```", "").strip()
    queries = json.loads(clean_json)
  except json.JSONDecodeError:
    queries = [state["question"]]
    
  return {"search_queries": queries}


def web_search_node(state:ResearchState):
  """  Step 2  The Agent actually browse the web """
  print(f" Searching the web for {len(state['search_queries'])} queries...")
  all_findings =[]
  
  for query in state['search_queries']:
    try:
      result = search_tool.invoke(query)
      all_findings.append(f"Search Query : {query} \n Findings : {result}")
    except Exception as e:
      print(f"Search failed for {query} :{e}")
  
  combined_findings = "\n\n".join(all_findings)
  return {"research_findings": combined_findings}

def synthesis_answer_node(state: ResearchState):
  """Step 3: The AI reads the findings and writes the final answer."""
  print("✍️ Writing the final report...")
  prompt = f"""You are a professional research assistant. Answer the user's question based strictly on the web search findings below.
    
  USER QUESTION: {state['question']}
   WEB FINDINGS:
    {state['research_findings']}
    
    Write a comprehensive, easy-to-read answer. Include a "Sources" or "Context" note at the bottom if appropriate.
    """
  response = llm.invoke([HumanMessage(content=prompt)])
  return {"final_answer": response.content}

workflow = StateGraph(ResearchState)

workflow.add_node("generate_queries", generate_queries_node)
workflow.add_node("web_search", web_search_node)
workflow.add_node("synthesize_answer", synthesis_answer_node)

workflow.set_entry_point("generate_queries")
workflow.add_edge("generate_queries","web_search")
workflow.add_edge("web_search","synthesize_answer")
workflow.add_edge("synthesize_answer","END")

research_agent = workflow.compile()

