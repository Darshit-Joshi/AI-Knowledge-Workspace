from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.document import Document
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse
from app.schemas.document import DocumentResponse  # <-- Added import
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    workspace_in: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Creates a new isolated AI knowledge workspace for the authenticated user."""
    workspace = Workspace(
        name=workspace_in.name,
        description=workspace_in.description,
        user_id=current_user.id
    )
    db.add(workspace)
    await db.commit()
    await db.refresh(workspace)
    return workspace

@router.get("", response_model=list[WorkspaceResponse])
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Lists all knowledge workspaces belonging strictly to the authenticated user."""
    result = await db.execute(
        select(Workspace).where(Workspace.user_id == current_user.id)
    )
    return result.scalars().all()

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetches a specific workspace by ID, verifying tenant access ownership."""
    result = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id, 
            Workspace.user_id == current_user.id
        )
    )
    workspace = result.scalar_one_or_none()
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or access denied."
        )
    return workspace

@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: int,
    workspace_in: WorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Updates workspace details (name, description) for an owned workspace."""
    result = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id, 
            Workspace.user_id == current_user.id
        )
    )
    workspace = result.scalar_one_or_none()
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or access denied."
        )
        
    update_data = workspace_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(workspace, key, value)
        
    await db.commit()
    await db.refresh(workspace)
    return workspace

@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Deletes a workspace, triggering automated cascades to scrub files, chats, and vectors."""
    result = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id, 
            Workspace.user_id == current_user.id
        )
    )
    workspace = result.scalar_one_or_none()
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or access denied."
        )
        
    await db.delete(workspace)
    await db.commit()
    return None

# =====================================================================
# --> NEW: Document Retrieval & Deletion Routes for UI Management <--
# =====================================================================

@router.get("/{workspace_id}/documents", response_model=list[DocumentResponse])
async def list_workspace_documents(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Lists all ingested documents belonging to a specific workspace."""
    # Verify workspace ownership first
    ws_result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == current_user.id)
    )
    if not ws_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    doc_result = await db.execute(
        select(Document).where(Document.workspace_id == workspace_id).order_by(Document.created_at.desc())
    )
    return doc_result.scalars().all()

@router.delete("/{workspace_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace_document(
    workspace_id: int,
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Deletes a document from the workspace database and clears its vector embeddings."""
    ws_result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == current_user.id)
    )
    if not ws_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    doc_result = await db.execute(
        select(Document).where(Document.id == document_id, Document.workspace_id == workspace_id)
    )
    document = doc_result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    await db.delete(document)
    await db.commit()
    return None