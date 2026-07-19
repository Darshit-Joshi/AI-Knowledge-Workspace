import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.services.vector_service import vector_service  # <-- Integrated vector service global instance

# --- MODEL REGISTRATION ---
# All ORM models MUST be imported before running Base.metadata.create_all()
# so SQLAlchemy can build the relational foreign-key dependency tree cleanly.
from app.models.user import User
from app.models.workspace import Workspace
from app.models.document import Document
from app.models.chat import ChatSession, Message
from app.models.report import Report

# --- API ROUTER IMPORTS ---
from app.api.v1.auth import router as auth_router
from app.api.v1.workspaces import router as workspaces_router
from app.api.v1.ingestion import router as ingestion_router
from app.api.v1.chat import router as chat_router
from app.api.v1.reports import router as reports_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("workspace_engine")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Modern async lifecycle manager for FastAPI.
    Handles startup database verifications and graceful shutdown pool disposal.
    """
    logger.info("⚡ Booting up AI Knowledge Workspace Engine...")
    
    # --- STARTUP ACTIONS ---
    # 1. Initialize Relational Database Tables (PostgreSQL)
    try:
        # In an async engine, table creation must run inside an asynchronous connection block
        # using run_sync to bridge SQLAlchemy's synchronous DDL execution engine.
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ PostgreSQL database schema and tables verified/created!")
    except Exception as e:
        logger.error(f"⚠️ Database startup error: Could not connect or initialize tables: {e}")
        
    # 2. Initialize and Verify Vector Database Indexes (Qdrant)
    try:
        logger.info("📡 Connecting to Qdrant Cloud to verify collections and schema...")
        await vector_service.ensure_collection_exists()
        logger.info("✅ Qdrant cloud collections and payload indexes verified/initialized!")
    except Exception as e:
        logger.error(f"⚠️ Vector DB startup error: Could not verify Qdrant indices: {e}")
        
    yield  # Application runs here and serves HTTP requests
    
    # --- SHUTDOWN ACTIONS ---
    logger.info("🛑 Shutting down AI Workspace services...")
    await engine.dispose()
    logger.info("💤 Database connection pools closed cleanly.")

# Initialize the main FastAPI server application
app = FastAPI(
    title="AI Knowledge Workspace",
    description="Production Asynchronous Backend Engine for Multi-Agent RAG Workspaces",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 1. Session Middleware: Required by Authlib to maintain state during Google OAuth redirects
app.add_middleware(
    SessionMiddleware, 
    secret_key=settings.SECRET_KEY
)

# 2. CORS Middleware: Enables seamless frontend API consumption from common React / Vite local ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
)

# 3. Mount all modular API v1 routers under a unified prefix
API_PREFIX = "/api/v1"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(workspaces_router, prefix=API_PREFIX)
app.include_router(ingestion_router, prefix=API_PREFIX)
app.include_router(chat_router, prefix=API_PREFIX)
app.include_router(reports_router, prefix=API_PREFIX)

@app.get("/", tags=["Health"])
async def health_check():
    """Root endpoint to quickly verify backend server operational status."""
    return {
        "status": "healthy",
        "service": "AI Knowledge Workspace Engine",
        "version": "1.0.0",
        "docs_url": "/docs"
    }