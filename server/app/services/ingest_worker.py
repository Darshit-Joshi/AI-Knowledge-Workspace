# app/services/ingest_worker.py
import os
import re
import logging
import traceback
from typing import Any
import httpx
from bs4 import BeautifulSoup
from pypdf import PdfReader
import docx
from youtube_transcript_api import YouTubeTranscriptApi
from langchain_text_splitters import RecursiveCharacterTextSplitter

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.document import Document, DocumentStatus, SourceType
from app.services.vector_service import vector_service

logger = logging.getLogger(__name__)

# Standard RAG chunking configuration: 1000 characters per chunk with a 200-character overlap
# to preserve semantic context across chunk boundaries.
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    separators=["\n\n", "\n", " ", ""]
)

# --- Text Extraction Handlers ---

def extract_pdf_text(file_path: str) -> str:
    """Extracts raw text from local PDF files using pypdf."""
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text.strip()

def extract_docx_text(file_path: str) -> str:
    """Extracts text paragraphs from Microsoft Word (.docx) documents."""
    doc = docx.Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs if para.text]).strip()

def extract_txt_or_md(file_path: str) -> str:
    """Reads standard plain text or Markdown files directly from disk."""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read().strip()

async def extract_web_text(url: str) -> str:
    """Scrapes raw HTML from a target URL and extracts clean body text using BeautifulSoup."""
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        response = await client.get(url, headers={"User-Agent": "AI-Knowledge-Bot/1.0"})
        response.raise_for_status()
        
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Remove script, style, and navigation tags to prevent polluting embeddings with code/menu clutter
    for element in soup(["script", "style", "nav", "footer", "header"]):
        element.extract()
        
    return soup.get_text(separator="\n", strip=True)

def extract_youtube_transcript(url: str) -> str:
    """Parses a YouTube URL for its video ID and fetches the auto-generated or manual transcript."""
    # Regex to capture the video ID from standard or short YouTube URLs
    video_id_match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
    if not video_id_match:
        raise ValueError("Invalid YouTube URL format. Could not extract Video ID.")
        
    video_id = video_id_match.group(1)
    yt_api = YouTubeTranscriptApi()
    transcript_list = yt_api.fetch(video_id)
    
    # Combine timestamped text blocks into a unified narrative string
    return " ".join([item.text for item in transcript_list])

# --- Main Background Ingestion Pipeline ---

async def process_document_ingestion(document_id: int):
    """
    Background worker orchestrator.
    Opens a fresh AsyncSession, processes text extraction, generates vector chunks,
    and updates the Document status in PostgreSQL.
    """
    async with AsyncSessionLocal() as db:
        document = None
        try:
            # 1. Retrieve the target Document record from PostgreSQL
            result = await db.execute(select(Document).where(Document.id == document_id))
            document = result.scalar_one_or_none()
            
            if not document:
                logger.error(f"Ingestion failed: Document ID {document_id} not found in database.")
                return

            # 2. Update status to PROCESSING so React frontend can display a loading state
            document.status = DocumentStatus.PROCESSING
            await db.commit()
            await db.refresh(document)
            
            logger.info(f"Starting extraction for document [{document.id}]: {document.title} ({document.source_type})")
            
            # 3. Route to the appropriate extractor based on SourceType enum
            raw_text = ""
            if document.source_type == SourceType.PDF:
                raw_text = extract_pdf_text(document.source_url_or_path)
            elif document.source_type == SourceType.DOCX:
                raw_text = extract_docx_text(document.source_url_or_path)
            elif document.source_type in [SourceType.TXT, SourceType.MARKDOWN]:
                raw_text = extract_txt_or_md(document.source_url_or_path)
            elif document.source_type == SourceType.WEB:
                raw_text = await extract_web_text(document.source_url_or_path)
            elif document.source_type == SourceType.YOUTUBE:
                raw_text = extract_youtube_transcript(document.source_url_or_path)
            else:
                raise ValueError(f"Unsupported extraction modality: {document.source_type}")

            if not raw_text:
                raise ValueError("Extraction yielded empty text. The file or URL might be blank or protected.")

            # 4. Chunk text into optimal sizes for vector embedding
            chunks = text_splitter.split_text(raw_text)
            logger.info(f"Generated {len(chunks)} text chunks for document [{document.id}].")

            # 5. Build rich metadata payloads for citation display in the frontend
            metadata_list = [
                {
                    "title": document.title,
                    "source_type": document.source_type.value,
                    "source_path": document.source_url_or_path
                }
                for _ in chunks
            ]

            # 6. Push chunks and embeddings into Qdrant via our VectorService
            await vector_service.store_chunks(
                chunks=chunks,
                metadata_list=metadata_list,
                workspace_id=document.workspace_id,
                document_id=document.id
            )

            # 7. Mark database record as COMPLETED
            document.status = DocumentStatus.COMPLETED
            document.error_message = None
            await db.commit()
            logger.info(f"Successfully completed ingestion pipeline for document [{document.id}].")

        except Exception as e:
            logger.error(f"Error during ingestion of document [{document_id}]: {str(e)}")
            logger.error(traceback.format_exc())
            
            if document:
                # Capture failure state and exact error traceback for UI debugging
                document.status = DocumentStatus.FAILED
                document.error_message = f"{type(e).__name__}: {str(e)[:500]}"
                await db.commit()