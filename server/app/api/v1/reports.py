# app/api/v1/reports.py
import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db, AsyncSessionLocal
from app.models.user import User
from app.models.workspace import Workspace
from app.models.report import Report, ReportStatus
from app.schemas.report import ReportGenerateRequest, ReportResponse
from app.api.v1.auth import get_current_user

# ---> IMPORT THE REAL REPORT LANGGRAPH ENGINE <---
from app.orchestration.agent_team import report_agent_graph

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/workspaces/{workspace_id}/reports", tags=["Reports & Research"])

async def verify_workspace_access(workspace_id: int, user_id: int, db: AsyncSession) -> Workspace:
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == user_id)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found or access denied.")
    return workspace

async def run_report_generation_pipeline(report_id: int, prompt: str, workspace_id: int):
    """Executes the autonomous LangGraph Section-Writer workflow inside an isolated database session."""
    async with AsyncSessionLocal() as db:
        report = None
        try:
            result = await db.execute(select(Report).where(Report.id == report_id))
            report = result.scalar_one_or_none()
            if not report:
                return

            logger.info(f"🚀 Kicking off autonomous report graph for Report ID: {report_id}")

            # ---> INVOKE THE LANGGRAPH MULTI-AGENT STATE MACHINE <---
            initial_state = {
                "topic": prompt,
                "workspace_id": workspace_id,
                "outline": [],
                "current_section_idx": 0,
                "completed_sections": {},
                "final_report_markdown": ""
            }
            
            final_state = await report_agent_graph.ainvoke(initial_state)
            generated_markdown = final_state.get("final_report_markdown") or "Failed to synthesize report content."

            # Save the compiled report back to PostgreSQL
            report.content = generated_markdown
            report.status = ReportStatus.COMPLETED
            await db.commit()
            logger.info(f"✅ Successfully compiled report [{report_id}]: {report.title}")
            
        except Exception as e:
            logger.error(f"❌ Report generation failed for ID [{report_id}]: {str(e)}")
            if report:
                report.status = ReportStatus.FAILED
                report.content = f"Report generation failed due to an error: {str(e)}"
                await db.commit()

@router.post("", response_model=ReportResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_report(
    workspace_id: int,
    payload: ReportGenerateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_workspace_access(workspace_id, current_user.id, db)

    report = Report(
        title=payload.title,
        content="Autonomous agent team is structuring an outline and drafting sections from workspace embeddings...",
        status=ReportStatus.GENERATING,
        workspace_id=workspace_id
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    background_tasks.add_task(
        run_report_generation_pipeline, 
        report_id=report.id, 
        prompt=payload.prompt, 
        workspace_id=workspace_id
    )
    return report

@router.get("", response_model=list[ReportResponse])
async def list_reports(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_workspace_access(workspace_id, current_user.id, db)
    result = await db.execute(
        select(Report).where(Report.workspace_id == workspace_id).order_by(Report.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    workspace_id: int,
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_workspace_access(workspace_id, current_user.id, db)
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.workspace_id == workspace_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    return report

@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    workspace_id: int,
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_workspace_access(workspace_id, current_user.id, db)
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.workspace_id == workspace_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    await db.delete(report)
    await db.commit()
    return None