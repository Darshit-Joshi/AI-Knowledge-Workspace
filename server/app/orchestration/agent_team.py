# app/orchestration/agent_team.py
import os
import logging
from typing import TypedDict, Any
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.services.vector_service import vector_service
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Gemini LLM for async agent orchestration
llm = ChatOpenAI(
    model="gpt-4o-mini", # Use "gpt-4o" for maximum reasoning capability
    temperature=0.3,
    api_key=settings.OPENAI_API_KEY
)

# --- Pydantic Schemas for Structured Output Binding ---

class QueryExpansionSchema(BaseModel):
    queries: list[str] = Field(..., description="2 to 3 specific search queries to retrieve relevant workspace documents.")

class CriticVerdictSchema(BaseModel):
    approved: bool = Field(..., description="True if the draft answer is factually accurate and supported by the context.")
    critique: str = Field(..., description="Detailed explanation of factual errors or omissions. Output 'Looks airtight!' if approved.")

class ReportOutlineSchema(BaseModel):
    sections: list[str] = Field(..., description="Chronological or logical section titles for the report.")

# ==========================================
# ENGINE 1: CHAT & DEBATE RAG WORKFLOW
# ==========================================

class ChatAgentState(TypedDict):
    question: str
    workspace_id: int
    expanded_queries: list[str]
    retrieved_context: str
    draft_answer: str
    critique_history: list[str]
    revision_count: int
    is_approved: bool
    final_answer: str
    citations: dict[str, Any]

async def query_expander_node(state: ChatAgentState) -> dict[str, Any]:
    """Step 1: Expands the user question into parallel semantic search queries."""
    logger.info(f"🧠 [EXPANDER] Generating queries for: '{state['question']}'")
    
    prompt = f"""You are an expert retrieval strategist.
    The user is asking: "{state['question']}"
    Generate 2 to 3 distinct semantic search queries that will help find relevant facts from private document embeddings.
    """
    try:
        structured_llm = llm.with_structured_output(QueryExpansionSchema)
        result: QueryExpansionSchema = await structured_llm.ainvoke([HumanMessage(content=prompt)])
        queries = result.queries
    except Exception as e:
        logger.warning(f"Structured output failed, falling back to raw query: {e}")
        queries = [state["question"]]
        
    return {"expanded_queries": queries}

# In app/orchestration/agent_team.py -> update workspace_retriever_node:

async def workspace_retriever_node(state: ChatAgentState) -> dict[str, Any]:
    """Step 2: Executes hybrid search across documents AND retrieves cross-session memories."""
    logger.info(f"🔍 [RETRIEVER] Searching workspace {state['workspace_id']}...")
    
    seen_ids = set()
    aggregated_chunks = []
    sources_metadata = []

    # 1. Fetch document chunks (Existing RAG logic)
    for query in state["expanded_queries"]:
        results = await vector_service.search_and_rerank(
            query=query,
            workspace_id=state["workspace_id"],
            top_k=3,
            fetch_k=20
        )
        for chunk in results:
            chunk_key = f"{chunk.get('document_id')}_{chunk.get('chunk_index')}"
            if chunk_key not in seen_ids:
                seen_ids.add(chunk_key)
                aggregated_chunks.append(chunk["text"])
                sources_metadata.append({
                    "id": f"[{len(sources_metadata) + 1}]",
                    "title": chunk.get("title", "Untitled Source"),
                    "source_type": chunk.get("source_type", "UNKNOWN"),
                    "confidence": round(chunk.get("rerank_score", 0.0), 2)
                })

    # 2. ---> NEW: Fetch Cross-Session Memories from Qdrant <---
    memories = await vector_service.search_memories(state["question"], state["workspace_id"], top_k=2)
    memory_block = ""
    if memories:
        memory_block = "### HISTORICAL CROSS-SESSION MEMORIES:\n" + "\n".join([f"- {m}" for m in memories]) + "\n\n"
        logger.info(f"🧠 [MEMORY INJECTION] Injected {len(memories)} past memories into agent context.")

    # 3. Combine memories + document chunks into the final context for the Drafter
    doc_context = "\n\n---\n\n".join(aggregated_chunks) if aggregated_chunks else "No relevant documents found."
    combined_context = f"{memory_block}### WORKSPACE DOCUMENT CONTEXT:\n{doc_context}"
    
    return {
        "retrieved_context": combined_context,
        "citations": {"sources": sources_metadata}
    }
    
    
async def drafter_node(state: ChatAgentState) -> dict[str, Any]:
    """Step 3: Synthesizes or revises an answer strictly using retrieved workspace context."""
    revision_no = state.get("revision_count", 0)
    logger.info(f"✍️ [DRAFTER] Writing answer (Attempt {revision_no + 1})...")
    
    if revision_no == 0:
        prompt = f"""You are an expert AI Research Assistant.
        Answer the user's question comprehensively using strictly the retrieved workspace facts below.
        
        USER QUESTION: {state['question']}
        WORKSPACE CONTEXT:
        {state['retrieved_context']}
        
        If the context does not contain enough information to answer completely, acknowledge the limitations.
        Cite sources naturally using bracketed numbers corresponding to the context if applicable."""
    else:
        latest_critique = state["critique_history"][-1]
        prompt = f"""You are an expert AI Research Assistant.
        Your previous answer was rejected by the Verification Critic for factual inaccuracies or unsupported claims.
        
        USER QUESTION: {state['question']}
        PREVIOUS DRAFT: {state['draft_answer']}
        CRITIC FEEDBACK: {latest_critique}
        WORKSPACE CONTEXT:
        {state['retrieved_context']}
        
        Rewrite your answer to address the critique and eliminate any hallucinations."""

    response = await llm.ainvoke([HumanMessage(content=prompt)])
    return {
        "draft_answer": response.content,
        "revision_count": revision_no + 1
    }

async def critic_node(state: ChatAgentState) -> dict[str, Any]:
    """Step 4: Verifies the draft answer against source context to eliminate hallucinations."""
    logger.info(f"⚖️ [CRITIC] Reviewing draft (Attempt {state['revision_count']})...")
    
    prompt = f"""You are a ruthless Fact-Checking Critic.
    Evaluate whether the Drafter's answer is 100% supported by the provided Workspace Context.
    Flag any hallucinations, exaggerations, or statements not directly backed by the text.
    
    USER QUESTION: {state['question']}
    WORKSPACE CONTEXT:
    {state['retrieved_context']}
    
    DRAFTER'S ANSWER:
    {state['draft_answer']}"""

    try:
        structured_llm = llm.with_structured_output(CriticVerdictSchema)
        verdict: CriticVerdictSchema = await structured_llm.ainvoke([HumanMessage(content=prompt)])
        is_approved = verdict.approved
        critique_text = verdict.critique
    except Exception as e:
        logger.warning(f"Critic fallback triggered due to parsing error: {e}")
        is_approved = True
        critique_text = "Approved by default (structured verification bypassed)."

    logger.info(f"⚖️ [CRITIC VERDICT]: {'APPROVED' if is_approved else 'REJECTED'} -> {critique_text}")
    
    history = list(state.get("critique_history", []))
    history.append(critique_text)
    
    return {
        "is_approved": is_approved,
        "critique_history": history,
        "final_answer": state["draft_answer"] if is_approved else ""
    }

def debate_router_edge(state: ChatAgentState) -> str:
    """Routes execution back to the drafter if rejected, or terminates if approved/max revisions reached."""
    if state["is_approved"] or state["revision_count"] >= 2:
        logger.info("🏁 Chat RAG workflow completed.")
        return END
    logger.info("🔄 Sending draft back for revision...")
    return "drafter"

# Build Chat Graph
chat_workflow = StateGraph(ChatAgentState)
chat_workflow.add_node("query_expander", query_expander_node)
chat_workflow.add_node("workspace_retriever", workspace_retriever_node)
chat_workflow.add_node("drafter", drafter_node)
chat_workflow.add_node("critic", critic_node)

chat_workflow.set_entry_point("query_expander")
chat_workflow.add_edge("query_expander", "workspace_retriever")
chat_workflow.add_edge("workspace_retriever", "drafter")
chat_workflow.add_edge("drafter", "critic")
chat_workflow.add_conditional_edges("critic", debate_router_edge, {"drafter": "drafter", END: END})

chat_agent_graph = chat_workflow.compile()


# ==========================================
# ENGINE 2: REPORT GENERATION WORKFLOW
# ==========================================

class ReportAgentState(TypedDict):
    topic: str
    workspace_id: int
    outline: list[str]
    current_section_idx: int
    completed_sections: dict[str, str]
    final_report_markdown: str

async def planner_node(state: ReportAgentState) -> dict[str, Any]:
    """Step 1: Breaks a broad research topic down into a structured 3-section outline."""
    logger.info(f"📋 [PLANNER] Creating research outline for: '{state['topic']}'")
    
    prompt = f"""You are an elite AI Research Director.
    The user wants a comprehensive research report based on private workspace knowledge regarding: "{state['topic']}".
    Break this topic down into exactly 3 logical, comprehensive section headings.
    """
    try:
        structured_llm = llm.with_structured_output(ReportOutlineSchema)
        result: ReportOutlineSchema = await structured_llm.ainvoke([HumanMessage(content=prompt)])
        outline = result.sections
    except Exception as e:
        logger.warning(f"Planner fallback triggered: {e}")
        outline = [f"1. Overview of {state['topic']}", "2. Key Insights & Architecture", "3. Strategic Implications"]
        
    return {"outline": outline, "current_section_idx": 0, "completed_sections": {}}

async def section_writer_node(state: ReportAgentState) -> dict[str, Any]:
    """Step 2: Performs targeted RAG retrieval and writes a comprehensive Markdown section."""
    idx = state["current_section_idx"]
    current_title = state["outline"][idx]
    logger.info(f"✍️ [WRITER] Drafting section {idx + 1}/{len(state['outline'])}: {current_title}")

    # Perform targeted hybrid retrieval for this specific section
    search_query = f"{state['topic']} {current_title}"
    results = await vector_service.search_and_rerank(
        query=search_query,
        workspace_id=state["workspace_id"],
        top_k=4,
        fetch_k=20
    )
    section_context = "\n\n".join([r["text"] for r in results]) if results else "No direct embeddings found. Synthesize using general architectural principles."

    prompt = f"""You are a specialized Technical Research Writer.
    Write a deeply detailed, exhaustive section for an executive research report based on the provided workspace context.
    
    OVERALL TOPIC: {state['topic']}
    CURRENT SECTION TITLE: {current_title}
    RETRIEVED WORKSPACE CONTEXT:
    {section_context}
    
    Write in clean, professional Markdown. Provide thorough technical analysis. Do NOT add a main report title header."""

    response = await llm.ainvoke([HumanMessage(content=prompt)])
    
    updated_sections = dict(state.get("completed_sections", {}))
    updated_sections[current_title] = response.content
    
    return {
        "completed_sections": updated_sections,
        "current_section_idx": idx + 1
    }

async def reviewer_node(state: ReportAgentState) -> dict[str, Any]:
    """Step 3: Stitches sections together and injects an executive Table of Contents."""
    logger.info("✨ [REVIEWER] Compiling final executive deliverable...")
    
    compiled_body = ""
    for title, content in state["completed_sections"].items():
        compiled_body += f"\n\n## {title}\n\n{content}\n"
        
    full_markdown = f"""# Deep-Dive Research Report: {state['topic']}
*Generated by Autonomous Multi-Agent Workspace Engine*

---

## Table of Contents
"""
    for title in state["outline"]:
        anchor = title.lower().replace(" ", "-").replace(".", "").replace("/", "")
        full_markdown += f"- [{title}](#{anchor})\n"
        
    full_markdown += f"\n---{compiled_body}"
    
    logger.info("🏆 [REVIEWER] Report packaging complete.")
    return {"final_report_markdown": full_markdown}

def writing_loop_router(state: ReportAgentState) -> str:
    """Loops back to the writer until all sections defined in the outline are completed."""
    if state["current_section_idx"] < len(state["outline"]):
        return "section_writer"
    return "reviewer"

# Build Report Graph
report_workflow = StateGraph(ReportAgentState)
report_workflow.add_node("planner", planner_node)
workflow_writer_name = "section_writer"
report_workflow.add_node(workflow_writer_name, section_writer_node)
report_workflow.add_node("reviewer", reviewer_node)

report_workflow.set_entry_point("planner")
report_workflow.add_edge("planner", workflow_writer_name)
report_workflow.add_conditional_edges(
    workflow_writer_name,
    writing_loop_router,
    {workflow_writer_name: workflow_writer_name, "reviewer": "reviewer"}
)
report_workflow.add_edge("reviewer", END)

report_agent_graph = report_workflow.compile()


# --- SUPER AGENT (SUPERVISOR ORCHESTRATOR) ---

class SupervisorDecisionSchema(BaseModel):
    selected_team: str = Field(
        ..., 
        description="Must be either 'debate_rag_team' for Q&A/fact-checking/chat, or 'report_team' for deep research reports and summaries."
    )
    reasoning: str = Field(..., description="Brief explanation of why this team was chosen.")

class SuperAgent:
    """
    The top-level orchestrator for your Capstone Workspace.
    Analyzes user prompts and delegates tasks to specialized autonomous sub-teams.
    """
    def __init__(self):
        self.router_llm = llm.with_structured_output(SupervisorDecisionSchema)

    async def execute(self, prompt: str, workspace_id: int) -> dict[str, Any]:
        logger.info(f"👑 [SUPER AGENT] Analyzing prompt: '{prompt}'")
        
        system_instruction = """You are the Supervisor Agent governing an AI Knowledge Workspace.
        You must decide which specialized agent team should handle the user's request:
        
        1. 'debate_rag_team': Choose this for questions, factual verification, debugging, general chat, or whenever the user asks for a specific answer that requires hallucination checking against workspace documents.
        2. 'report_team': Choose this when the user explicitly asks to generate a comprehensive report, executive summary, deep-dive document, or multi-section analysis."""

        try:
            decision: SupervisorDecisionSchema = await self.router_llm.ainvoke([ SystemMessage(content=system_instruction), HumanMessage(content=prompt)])
            team = decision.selected_team
            logger.info(f"👑 [SUPER AGENT] Delegating to -> {team} ({decision.reasoning})")
        except Exception as e:
            logger.warning(f"👑 [SUPER AGENT] Routing fallback defaulted to chat: {e}")
            team = "debate_rag_team"

        # Delegate execution to the chosen LangGraph sub-team
        if team == "report_team":
            initial_state = {
                "topic": prompt,
                "workspace_id": workspace_id,
                "outline": [],
                "current_section_idx": 0,
                "completed_sections": {},
                "final_report_markdown": ""
            }
            result = await report_agent_graph.ainvoke(initial_state)
            return {
                "team_used": "Autonomous Report Team",
                "content": result.get("final_report_markdown"),
                "hallucination_check_run": False
            }
        else:
            initial_state = {
                "question": prompt,
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
            result = await chat_agent_graph.ainvoke(initial_state)
            return {
                "team_used": "Debate & Fact-Checking RAG Team",
                "content": result.get("final_answer") or result.get("draft_answer"),
                "hallucination_check_run": True,
                "revisions_required": result.get("revision_count"),
                "critique_trail": result.get("critique_history"),
                "citations": result.get("citations")
            }

# Global singleton to use across your API controllers
super_agent = SuperAgent()