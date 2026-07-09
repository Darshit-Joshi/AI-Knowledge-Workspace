from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
import shutil
import os
from ai.ingestion.pdf_ingestor import ingest_pdf  # Your function!
from ai.models.document import Document
from routes.auth import get_current_user

router = APIRouter(prefix="/documents", tags=["Document Ingestion"])

# Ensure an uploads directory exists on your server
UPLOAD_DIR = "./temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_and_ingest_pdf(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Receives a PDF from the user, saves it temporarily, 
    and runs your ingest_pdf() function on it.
    """
    # 1. Validate that the user actually uploaded a PDF
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Only PDFs are allowed."
        )
        
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        # 2. Save the uploaded file from the browser to your local disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 3. CALL YOUR INGEST FUNCTION!
        # This reads the saved file, extracts pages, and returns your Document object
        document, pages = ingest_pdf(file_path)
        
        # 4. Next Steps (Optional): 
        # Here is where you would pass 'document' and 'pages' to your chunker 
        # and store the embeddings in ChromaDB!
        # e.g., chunks = create_pdf_chunks(document, pages)
        #       vector_store.store_chunks(chunks)
        
        return {
            "message": "PDF successfully ingested!",
            "document_title": document.title,
            "total_pages": document.metadata["page_count"],
            "preview": document.content[:200] + "..."  # First 200 characters
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to ingest PDF: {str(e)}"
        )
    finally:
        # 5. Clean up: delete the temporary file from disk after reading it
        if os.path.exists(file_path):
            os.remove(file_path)