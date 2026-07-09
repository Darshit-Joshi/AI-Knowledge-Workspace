# create_db.py

from core.database import Base
from core.database import engine

from ai.database.conversation_table import ConversationTable
from ai.database.message_table import MessageTable

Base.metadata.create_all(bind=engine)

print("Tables created")