from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey

from core.database import Base


class MessageTable(Base):

    __tablename__ = "messages"

    id = Column(
        String,
        primary_key=True
    )

    conversation_id = Column(
        String,
        ForeignKey("conversations.id"),
        nullable=False,
        index=True
    )

    role = Column(
        String,
        nullable=False
    )

    content = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime,
        nullable=False
    )