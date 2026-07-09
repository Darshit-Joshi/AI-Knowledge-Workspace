from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import DateTime
from core.database import Base

class ConversationTable(Base):

    __tablename__ = "conversations"

    id = Column(
        String,
        primary_key=True
    )

    workspace_id = Column(
        String,
        nullable=False,
        index=True
    )

    title = Column(
        String,
        nullable=False
    )

    created_at = Column(
        DateTime,
        nullable=False
    )