import os
import uuid
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from core.database import get_qdrant

COLLECTION_NAME = "workspace_knowledge"

def initialize_qdrant_collection(client: QdrantClient):
  collections = client.get_collections().collections
  exists = any(col.name == COLLECTION_NAME for col in collections)
  
  if not exists :
     client.create_collection(collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),)
     
  
async def proces_document_pipeline(file_path : str, doc_id: int, user_email:str) -> int :
  client = get_qdrant()
  initialize_qdrant_collection(client)
  
  raw_text=""
  if file_path.endswith('.pdf'):
    reader = PdfReader(file_path)
    for page  in reader.pages:
      text = page.extract_text()
      if text :
        raw_text += text + '\n'
    else :
       with open( file_path, 'r', encoding="utf-8") as f:
         raw_text = f.read()
         
    if not raw_text.strip():
     return 0
   
    splitter = RecursiveCharacterTextSplitter(
     chunk_size=500,
     chunk_overlap = 50,
     separators=["\n\n", "\n", "." , " ", ""]
   )
    chunks = splitter.split_text(raw_text)
    
    metadata_list = [
        {"doc_id": doc_id, "user_email": user_email, "text": chunk_text, "chunk_index": i}
        for i, chunk_text in enumerate(chunks)
    ]
    
    client.add(
        collection_name=COLLECTION_NAME,
        documents=chunks,        # Automatically embedded using BAAI/bge-small-en-v1.5
        metadata=metadata_list,  # Attached metadata for citation display later
        ids=[uuid.uuid4().hex for _ in chunks]
    )

    return len(chunks)
  
  