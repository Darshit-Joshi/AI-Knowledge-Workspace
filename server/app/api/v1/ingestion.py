# app/api/v1/ingestion.py
import os
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.document import Document, SourceType, DocumentStatus
from app.schemas.document import DocumentResponse, WebIngestionRequest, YouTubeIngestionRequest
from app.api.v1.auth import get_current_user

# ---> IMPORT THE REAL INGESTION WORKER HERE <---
from app.services.ingest_worker import process_document_ingestion

router = APIRouter(prefix="/workspaces/{workspace_id}/ingest", tags=["Ingestion"])

UPLOAD_DIR = "/tmp/workspace_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def verify_workspace_ownership(workspace_id: int, user_id: int, db: AsyncSession) -> Workspace:
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == user_id)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found or access denied.")
    return workspace

@router.post("/file", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_file(
    workspace_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_workspace_ownership(workspace_id, current_user.id, db)
    
    filename = file.filename or "unknown_file"
    ext = filename.split(".")[-1].upper()
    
    if ext not in SourceType.__members__:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext.lower()}'. Supported extensions: PDF, DOCX, TXT, MARKDOWN"
        )
        
    source_type = SourceType[ext]
    workspace_folder = os.path.join(UPLOAD_DIR, str(workspace_id))
    os.makedirs(workspace_folder, exist_ok=True)
    file_path = os.path.join(workspace_folder, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_document = Document(
        title=filename,
        source_type=source_type,
        source_url_or_path=file_path,
        status=DocumentStatus.PENDING,
        workspace_id=workspace_id
    )
    db.add(db_document)
    await db.commit()
    await db.refresh(db_document)
    
    # ---> TRIGGER THE REAL ETL PIPELINE <---
    background_tasks.add_task(process_document_ingestion, db_document.id)
    return db_document

@router.post("/web", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_web_page(
    workspace_id: int,
    payload: WebIngestionRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_workspace_ownership(workspace_id, current_user.id, db)
    url_str = str(payload.url)
    title = payload.title or url_str.split("//")[-1].split("/")[0]
    
    db_document = Document(
        title=title,
        source_type=SourceType.WEB,
        source_url_or_path=url_str,
        status=DocumentStatus.PENDING,
        workspace_id=workspace_id
    )
    db.add(db_document)
    await db.commit()
    await db.refresh(db_document)
    
    # ---> TRIGGER THE REAL ETL PIPELINE <---
    background_tasks.add_task(process_document_ingestion, db_document.id)
    return db_document

@router.post("/youtube", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_youtube_transcript(
    workspace_id: int,
    payload: YouTubeIngestionRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_workspace_ownership(workspace_id, current_user.id, db)
    url_str = str(payload.url)
    title = payload.title or "YouTube Video Ingestion"
    
    db_document = Document(
        title=title,
        source_type=SourceType.YOUTUBE,
        source_url_or_path=url_str,
        status=DocumentStatus.PENDING,
        workspace_id=workspace_id
    )
    db.add(db_document)
    await db.commit()
    await db.refresh(db_document)
    
    # ---> TRIGGER THE REAL ETL PIPELINE <---
    background_tasks.add_task(process_document_ingestion, db_document.id)
    return db_document