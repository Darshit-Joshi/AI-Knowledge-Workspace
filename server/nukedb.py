import asyncio
from sqlalchemy import text
from app.core.database import engine, Base

# CRITICAL: Import ALL models so SQLAlchemy registers their metadata
from app.models.user import User
from app.models.workspace import Workspace
from app.models.document import Document
from app.models.chat import ChatSession, Message
from app.models.report import Report


async def nuke_and_rebuild():
    print("💥 Connecting to PostgreSQL...")
    async with engine.begin() as conn:
        print("☢️ Dropping entire public schema to bypass all ENUM and table locks...")
        # This instantly obliterates all tables, types, and constraints in one microsecond
        await conn.execute(text("DROP SCHEMA public CASCADE;"))
        await conn.execute(text("CREATE SCHEMA public;"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))

        print("🏗️ Recreating clean, synchronized tables from Python models...")
        await conn.run_sync(Base.metadata.create_all)

    # Safely close the connection pool before Windows shuts down the asyncio loop
    await engine.dispose()
    print("✨ Database successfully nuked and rebuilt!")


if __name__ == "__main__":
    asyncio.run(nuke_and_rebuild())