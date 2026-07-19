import asyncio
from sqlalchemy import text
from app.core.database import engine, Base

# Import all models so SQLAlchemy registers their metadata
from app.models.user import User
from app.models.workspace import Workspace
from app.models.document import Document
from app.models.chat import ChatSession, Message
from app.models.report import Report


async def reset_database():
    async with engine.begin() as conn:
        print("⚠️ Dropping outdated tables and custom ENUM types...")
        # Using raw SQL with CASCADE ensures old ENUMs and constraints are cleanly wiped
        await conn.execute(
            text(
                "DROP TABLE IF EXISTS messages, chat_sessions, reports, documents, workspaces, users CASCADE;"
            )
        )
        await conn.execute(
            text(
                "DROP TYPE IF EXISTS sourcetype, documentstatus, messagerole, reportstatus CASCADE;"
            )
        )
        print("✨ Building fresh schema from current models...")
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Success! Database is now 100% synchronized with your code.")


if __name__ == "__main__":
    asyncio.run(reset_database())