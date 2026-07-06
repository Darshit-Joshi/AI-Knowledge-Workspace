from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from api.auth import router as auth_router
from core.config import settings

app = FastAPI(
    title="AI Knowledge Workspace",
    description="Backend Engine for our multi-agent RAG Workspace",
    version="1.0.0"
)

app.add_middleware(SessionMiddleware,  secret_key=settings.SECRET_KEY)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:5174",], allow_credentials=True, allow_headers=["*"], allow_methods=["*"])

app.include_router(auth_router)

@app.get("/")
async def health_check():
    return {
        "status":"healthy",
        "service":"AI KKnowledge WorkSpace",
        "database":"disconnected"
    }
