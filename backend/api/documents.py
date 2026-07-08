import os 
import shutil
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from core.database import get_db
from models.document import Document
from services.ingestion_service import proces_document_pipeline
from api.auth import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents &  knowledge Base"])

UPLOAD_DIR = "storage/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def run_ingestion_background( file_path: str, doc_id:int, user_email: str, db:Session):
  try:
    import asyncio
    chunk_count = asyncio.run(proces_document_pipeline(file_path, doc_id, user_email))
    doc = db.query(Document).filter(Document).filter(Document.id == doc_id).first()
    if doc:
      doc.status="ready"
      doc.chunk_count = chunk_count
      db.commit()
  except Exception as e:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if doc:
      doc.status ="failed"
      doc.commit()
    print(f"Ingestion Error for doc {doc_id} :{str(e)}")
    
@router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
  background_tasks:BackgroundTasks,
  file: UploadFile = Depends(get_db),
  current_user : dict = Depends(get_curent_user)
):
  if not file.filename.endswith((".pdf", ".txt")):
    raise HTTPException(status_code=400, detail="Only .pdf and .txt files are supported right now.")
  
  file_path = os.path.join(UPLOAD_DIR, f"{current_user['email']}_{file.filename}")
  with open (file_path, "wb") as buffer:
    shutil.copyfileobj(file.file, buffer)
    
  new_doc = Document(
    title=file.filename,
    file_type =file.filename.split(".")[-1],
    file_path=file_path,
    status="processing",
    user_email = current_user['email']
  )
  
  db.add(new_doc)
  db.commit()
  db.refresh(new_doc)
  
  background_tasks.add_task(run_ingestion_background, file_path, new_doc.id, current_user["email"], db)
  
  return {
        "message": "File uploaded successfully. Ingestion started.",
        "doc_id": new_doc.id,
        "status": "processing"
    }
  
@router.get('/')
async def get_my_documents(db : Session = Depends(get_db), current_user : dict = Depends(get_current_user)):
  docs = db.query(Document).filter(Document.user_email == current_user['email']).all()
  return docs