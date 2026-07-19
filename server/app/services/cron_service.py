# app/services/cron_service.py
import logging
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.workspace import Workspace
from app.models.report import Report, ReportStatus
from app.orchestration.agent_team import report_agent_graph

logger = logging.getLogger("workspace_engine")

# Initialize global asynchronous scheduler
scheduler = AsyncIOScheduler()

async def run_daily_morning_briefing():
    """
    PROACTIVE AGENT TASK: Daily Workspace & Industry Digest
    Wakes up automatically, iterates through active workspaces, runs autonomous research,
    and saves a completed briefing report directly into the PostgreSQL database.
    """
    current_time_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    logger.info(f"⏰ [CRON WAKEUP - {current_time_str}] Executing Proactive Morning Briefing...")
    
    async with AsyncSessionLocal() as db:
        try:
            # 1. Fetch all active workspaces to deliver tailored briefings
            result = await db.execute(select(Workspace))
            workspaces = result.scalars().all()
            
            if not workspaces:
                logger.info("ℹ️ [CRON] No active workspaces found in database. Skipping proactive briefing.")
                return

            target_topic = "Top AI and Full-Stack Development Trends from the Last 24 Hours"

            for ws in workspaces:
                logger.info(f"🚀 [CRON] Compiling briefing for Workspace [{ws.id}]: {ws.name}")
                
                # 2. Create an initial Report record in GENERATING state
                report = Report(
                    title=f"☀️ Daily Proactive Briefing ({datetime.now().strftime('%b %d, %Y')})",
                    content="Autonomous cron agent is currently synthesizing your morning briefing...",
                    status=ReportStatus.GENERATING,
                    workspace_id=ws.id
                )
                db.add(report)
                await db.commit()
                await db.refresh(report)

                # 3. Invoke the LangGraph report workflow asynchronously
                initial_state = {
                    "topic": target_topic,
                    "workspace_id": ws.id,
                    "outline": [],
                    "current_section_idx": 0,
                    "completed_sections": {},
                    "final_report_markdown": ""
                }
                
                final_state = await report_agent_graph.ainvoke(initial_state)
                generated_markdown = final_state.get("final_report_markdown") or "Failed to generate briefing content."

                # 4. Save completed markdown deliverable straight to user's workspace inbox
                report.content = generated_markdown
                report.status = ReportStatus.COMPLETED
                await db.commit()
                
                logger.info(f"✅ [CRON SUCCESS] Briefing saved to Workspace [{ws.id}] inbox!")
                
        except Exception as e:
            logger.error(f"❌ [CRON FAILURE] Proactive Agent encountered an error: {str(e)}")

def start_background_scheduler():
    """Configures triggers and starts the background scheduler during FastAPI boot."""
    if not scheduler.running:
        # 1. Daily Production Job: Wakes up every morning at 8:00 AM UTC
        scheduler.add_job(
            run_daily_morning_briefing,
            trigger=CronTrigger(hour=8, minute=0),
            id="daily_morning_briefing",
            name="Daily Proactive Workspace Briefing",
            replace_existing=True
        )
        
        # 2. Demo / Dev Job: Runs every 60 minutes to keep background synthesis active
        scheduler.add_job(
            run_daily_morning_briefing,
            trigger=IntervalTrigger(minutes=60),
            id="demo_interval_briefing",
            name="Hourly Dev Digest",
            replace_existing=True
        )
        
        scheduler.start()
        logger.info("🚀 [CRON SERVICE] Proactive Agent Scheduler started successfully.")

def stop_background_scheduler():
    """Gracefully shuts down scheduled background jobs on server exit."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("🛑 [CRON SERVICE] Scheduler shut down cleanly.")