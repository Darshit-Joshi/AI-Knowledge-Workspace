# ai/repositories/conversation_repository.py

from core.database import SessionLocal

from ai.database.message_table import (
    MessageTable
)

from ai.database.conversation_table import (
    ConversationTable
)


class ConversationRepository:

    def create_conversation(
        self,
        conversation
    ):

        db = SessionLocal()

        row = ConversationTable(
            id=conversation.id,
            workspace_id=conversation.workspace_id,
            title=conversation.title,
            created_at=conversation.created_at
        )

        db.add(row)
        db.commit()
        db.close()

    def save_message(
        self,
        message
    ):

        db = SessionLocal()

        row = MessageTable(
            id=message.id,
            conversation_id=message.conversation_id,
            role=message.role,
            content=message.content,
            created_at=message.created_at
        )

        db.add(row)
        db.commit()
        db.close()

    def get_messages(
        self,
        conversation_id: str
    ):

        db = SessionLocal()

        messages = (
            db.query(MessageTable)
            .filter(
                MessageTable.conversation_id
                == conversation_id
            )
            .order_by(
                MessageTable.created_at
            )
            .all()
        )

        db.close()

        return messages