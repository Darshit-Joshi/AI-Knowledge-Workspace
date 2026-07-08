from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from core.database import Base

class Document(Base) :
  __tablename__ = "documents"
  
  id = Column(Integer, primary_key=True, index=True)
  title = Column(String, nullable=False)
  file_type = Column(String, nullable=False)
  file_path =Column(String, nullable=True)
  status = Column(String, default="processing") 
  chunk_count = Column(Integer, default=0)
  user_email = Column(String, nullable=False, index=True)
  created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))