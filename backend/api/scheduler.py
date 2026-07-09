from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from services.cron_service import scheduler, run_daily_morning_briefing
from api.auth import get_current_user

router = APIRouter(prefix="/scheduler", tags=["Proactive Cron Schedulers"])

class ScheduledJobInfo(BaseModel):
    job_id: str
    name: str
    next_run_time: Optional[str]

@router.get("/jobs", response_model=List[ScheduledJobInfo])
async def list_active_scheduled_jobs(current_user: dict = Depends(get_current_user)):
    """
    Returns a list of all currently active proactive background jobs and their next scheduled execution time.
    """
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append(ScheduledJobInfo(
            job_id=job.id,
            name=job.name,
            next_run_time=str(job.next_run_time) if job.next_run_time else "Paused"
        ))
    return jobs


@router.post("/trigger-now/{job_id}", status_code=status.HTTP_202_ACCEPTED)
async def manually_trigger_proactive_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Demo/Test Endpoint: Manually forces a proactive background job to run immediately 
    without waiting for its scheduled cron time!
    """
    job = scheduler.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Scheduled job '{job_id}' not found.")

    # Execute the proactive task instantly via background worker
    if job_id in ["daily_morning_briefing", "demo_interval_briefing"]:
        background_tasks.add_task(run_daily_morning_briefing)
        return {"message": f"Job '{job.name}' triggered manually. Watch your server terminal for output!"}
        
    raise HTTPException(status_code=400, detail="Job execution handler not mapped.")