from dotenv import load_dotenv
import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
import fitz  # PyMuPDF
import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import OpenAI
from dotenv import load_dotenv

# Import your existing JWT auth dependency
from api.auth import get_current_user

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# =====================================================================
# 1. ROUTER & GLOBALS SETUP
# =====================================================================
router = APIRouter(prefix="/rag", tags=["RAG & Document Intelligence"])

# Ensure temp upload directory exists
UPLOAD_DIR = "./temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize OpenAI Client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize ChromaDB Vector Store (Persistent)
chroma_client = chromadb.PersistentClient(path="./chroma_db")
knowledge_collection = chroma_client.get_or_create_collection(name="knowledge_base")

# Initialize LangChain Text Splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100,
    separators=["\n\n", "\n", ".", " ", ""]
)

# =====================================================================
# 2. PYDANTIC SCHEMAS
# =====================================================================
class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, description="The question to ask the RAG knowledge base")
    thread_id: Optional[str] = Field(default="default_thread", description="Conversation session ID")
    k: int = Field(default=5, ge=1, le=10, description="Number of context chunks to retrieve")

class RetrievedSource(BaseModel):
    document_title: str
    page_number: int
    text_snippet: str
    relevance_score: float

class ChatResponse(BaseModel):
    answer: str
    sources: List[RetrievedSource]

class UploadResponse(BaseModel):
    message: str
    document_id: str
    document_title: str
    total_pages: int
    total_chunks_stored: int

# =====================================================================
# 3. ENDPOINT: UPLOAD & INGEST PDF (/rag/upload)
# =====================================================================
@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_and_ingest_pdf(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    1. Receives a PDF file.
    2. Extracts text page-by-page using PyMuPDF.
    3. Splits text into manageable overlapping chunks.
    4. Generates OpenAI vector embeddings for each chunk.
    5. Saves chunks and embeddings into ChromaDB vector database.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF files are permitted.")

    file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    document_id = str(uuid.uuid4())

    try:
        # Save file locally
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract pages using PyMuPDF
        doc = fitz.open(file_path)
        pages_data = []
        for page_num, page in enumerate(doc):
            pages_data.append({
                "page_num": page_num + 1,
                "text": page.get_text()
            })
        doc.close()

        # Create Chunks
        ids = []
        documents = []
        metadatas = []

        chunk_counter = 0
        for page in pages_data:
            if not page["text"].strip():
                continue
            
            splits = text_splitter.split_text(page["text"])
            for split_text in splits:
                ids.append(f"{document_id}_{chunk_counter}")
                documents.append(split_text)
                metadatas.append({
                    "document_id": document_id,
                    "document_title": file.filename,
                    "page_number": page["page_num"],
                    "chunk_index": chunk_counter,
                    "uploaded_by": current_user.get("email", "unknown")
                })
                chunk_counter += 1

        if not documents:
            raise HTTPException(status_code=400, detail="Could not extract any readable text from this PDF.")

        # Generate Embeddings in batches via OpenAI
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=documents
        )
        embeddings = [item.embedding for item in response.data]

        # Store in ChromaDB
        knowledge_collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )

        return UploadResponse(
            message="PDF successfully processed and stored in knowledge base!",
            document_id=document_id,
            document_title=file.filename,
            total_pages=len(pages_data),
            total_chunks_stored=len(documents)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Ingestion Failed: {str(e)}")
    
    finally:
        # Cleanup temporary PDF file
        if os.path.exists(file_path):
            os.remove(file_path)

# =====================================================================
# 4. ENDPOINT: CHAT WITH RAG (/rag/chat)
# =====================================================================
@router.post("/chat", response_model=ChatResponse)
async def chat_with_rag(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    1. Converts user question into an OpenAI embedding.
    2. Performs semantic similarity search against ChromaDB.
    3. Constructs a system prompt injected with the retrieved chunks.
    4. Calls OpenAI LLM to generate an accurate, source-backed answer.
    """
    clean_query = request.query.strip()
    if not clean_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        # 1. Embed the user query
        query_embedding_response = client.embeddings.create(
            model="text-embedding-3-small",
            input=clean_query
        )
        query_embedding = query_embedding_response.data[0].embedding

        # 2. Query ChromaDB for top K relevant chunks
        search_results = knowledge_collection.query(
            query_embeddings=[query_embedding],
            n_results=request.k
        )

        retrieved_docs = search_results.get("documents", [[]])[0]
        retrieved_metas = search_results.get("metadatas", [[]])[0]
        retrieved_dists = search_results.get("distances", [[]])[0]

        if not retrieved_docs:
            return ChatResponse(
                answer="I couldn't find any relevant documents in the knowledge base to answer your question. Please upload a PDF first!",
                sources=[]
            )

        # 3. Format Context & Sources
        context_blocks = []
        sources_list = []

        for doc_text, meta, dist in zip(retrieved_docs, retrieved_metas, retrieved_dists):
            relevance = max(0.0, 1.0 - dist)  # Convert cosine distance to an approximate score
            context_blocks.append(f"--- [Source: {meta['document_title']}, Page {meta['page_number']}] ---\n{doc_text}")
            
            sources_list.append(
                RetrievedSource(
                    document_title=meta["document_title"],
                    page_number=meta["page_number"],
                    text_snippet=doc_text[:150] + "...",
                    relevance_score=round(relevance, 2)
                )
            )

        combined_context = "\n\n".join(context_blocks)

        # 4. Build Prompt & Call LLM
        system_prompt = f"""You are a helpful AI assistant powered by a RAG (Retrieval-Augmented Generation) pipeline.
Answer the user's question accurately using ONLY the provided context below.
If the exact answer is not contained within the context, state clearly that the information could not be found in the uploaded documents. Do NOT make up facts.

Context:
{combined_context}"""

        completion = client.chat.completions.create(
            model="gpt-4o-mini",  # Using standard fast OpenAI chat model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": clean_query}
            ],
            temperature=0.2  # Low temperature for factual precision
        )

        llm_answer = completion.choices[0].message.content

        return ChatResponse(
            answer=llm_answer,
            sources=sources_list
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Chat Failed: {str(e)}")