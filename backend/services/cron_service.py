import os
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from agents.web_researcher import research_agent

# Initialize the global asynchronous scheduler
scheduler = AsyncIOScheduler()

async def run_daily_morning_briefing():
    """
    PROACTIVE AGENT TASK 1: Morning Market & Tech Digest
    This function wakes up automatically without any user prompt.
    It runs our LangGraph research agent to compile a fresh daily briefing.
    """
    print(f"\n⏰ [CRON WAKEUP - {datetime.now(timezone.utc).strftime('%H:%M:%S')} UTC] Executing Proactive Morning Briefing...")
    
    # We can customize this prompt dynamically or pull target topics from PostgreSQL
    target_query = "What are the top 3 most important AI and tech news headlines from the last 24 hours?"
    
    try:
        initial_state = {
            "question": target_query,
            "search_queries": [],
            "research_findings": "",
            "final_answer": ""
        }
        
        # Execute the LangGraph workflow autonomously
        final_state = research_agent.invoke(initial_state)
        briefing_content = final_state["final_answer"]
        
        # 💡 FUTURE DATABASE WRITING:
        # Once your teammate's database models are finalized, you can save this straight to the user's inbox:
        # new_report = Report(title="Daily Proactive Briefing", content_markdown=briefing_content, status="ready")
        # db.add(new_report)...
        
        print("✅ [CRON SUCCESS] Proactive Briefing Compiled Successfully!")
        print(f"📰 Briefing Preview:\n{briefing_content[:300]}...\n")
        
    except Exception as e:
        print(f"❌ [CRON FAILURE] Proactive Agent encountered an error: {str(e)}")


def start_background_scheduler():
    """
    Configures and boots up the background cron scheduler.
    Called once during FastAPI server startup.
    """
    if not scheduler.running:
        # 1. Register a real-world Daily Cron Job (e.g., Every day at 8:00 AM UTC)
        scheduler.add_job(
            run_daily_morning_briefing,
            trigger=CronTrigger(hour=8, minute=0),
            id="daily_morning_briefing",
            name="Daily AI News & Workspace Briefing",
            replace_existing=True
        )
        
        # 2. Register a Demo/Testing Interval Job (Runs every 30 minutes to keep system active)
        scheduler.add_job(
            run_daily_morning_briefing,
            trigger=IntervalTrigger(minutes=30),
            id="demo_interval_briefing",
            name="Demo 30-Minute Interval Digest",
            replace_existing=True
        )
        
        scheduler.start()
        print("🚀 [CRON SERVICE] Proactive Agent Scheduler started successfully.")


def stop_background_scheduler():
    """Gracefully shuts down scheduled jobs when server stops."""
    if scheduler.running:
        scheduler.shutdown()
        print("🛑 [CRON SERVICE] Scheduler shut down cleanly.")