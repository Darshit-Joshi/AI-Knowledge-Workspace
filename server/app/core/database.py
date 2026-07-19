from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from qdrant_client import AsyncQdrantClient
from app.core.config import settings

# 1. Setup Modern Async Engine for PostgreSQL with Caching Disabled
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Tests dropped connections before handing them to routes
    echo=False,          # Set to True only when debugging SQL output
    connect_args={
        "statement_cache_size": 0  # CRITICAL: Prevents InvalidCachedStatementError on reload
    }
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False  # Essential for async state persistence after commit
)

# Modern SQLAlchemy 2.0 Base Class
class Base(DeclarativeBase):
    pass

# FastAPI Dependency for Database Sessions
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# 2. Setup Vector Store Infrastructure (Non-blocking Async Client)
qdrant_client = AsyncQdrantClient(
    url=settings.QDRANT_URL,
    api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None
)

async def get_qdrant() -> AsyncQdrantClient:
    return qdrant_client