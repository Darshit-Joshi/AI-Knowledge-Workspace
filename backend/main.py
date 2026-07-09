import os
from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from core.database import engine, Base
from models.user import User
from models.document import Document

from api.rag import router as rag_router
from api.auth import router as auth_router
from core.config import settings
#from api.documents import router as docs_router
from api.agents import router as agents_router
from api.scheduler import router as scheduler_router
from services.cron_service import start_background_scheduler, stop_background_scheduler
from api.chat import router as chat_router

from services.cron_service import start_background_scheduler, stop_background_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ACTIONS ---
    print("⚡ Booting up AI Knowledge Workspace...")
    try:
      Base.metadata.create_all(bind=engine)
      print(f"✅ Database tables verified/created!")
    except Exception as e:
        print(f"⚠️ Database startup warning: Could not connect to Neon DB: {e}")
        
    try:
     start_background_scheduler() # Wake up proactive cron agents!
     print("⏰ Scheduler booted successfully!")
    except Exception as e:
        print(f"⚠️ Scheduler startup warning: {e}")
        
    yield # Application runs here
    
    # --- SHUTDOWN ACTIONS ---
    print("🛑 Shutting down workspace services...")
    stop_background_scheduler()
    
    
app = FastAPI(
    title="AI Knowledge Workspace",
    description="Backend Engine for our multi-agent RAG Workspace",
    version="1.0.0",
    lifespan=lifespan
)



app.add_middleware(SessionMiddleware,  secret_key=settings.SECRET_KEY)

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:5174",], allow_credentials=True, allow_headers=["*"], allow_methods=["*"])

app.include_router(auth_router)
#app.include_router(docs_router)
app.include_router(agents_router)
app.include_router(scheduler_router)
app.include_router(chat_router)
app.include_router(rag_router)

@app.get("/")
async def health_check():
    return {
        "status":"healthy",
        "service":"AI KKnowledge WorkSpace",
        "database":"disconnected"
    }
