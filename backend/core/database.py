from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from qdrant_client import QdrantClient
from core.config import settings

DATABASE_URL = getattr( settings, "DATABASE_URL", "postgresql://postgresql:password@localhost:5432/ai_workspace")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base

def get_db():
  db = SessionLocal()
  try:
    yield db 
  finally:
    db.close()
    
QDRANT_URL = getattr(settings, "QDRANT_URL", "http://localhost:6333")
qdrant_client = QdrantClient(url=QDRANT_URL)

def get_qdrant():
    """Returns the Qdrant client instance."""
    return qdrant_client