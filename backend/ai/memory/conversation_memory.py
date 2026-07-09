from ai.repositories.conversation_repository import ConversationRepository
from ai.models.chat_messages import ChatMessage


class ConversationMemory:

    def __init__(
        self,
        repository: ConversationRepository
    ):
        self.repository = repository

    def get_history(
        self,
        conversation_id: str
    ) -> list[ChatMessage]:
        """
        Returns complete conversation history.
        """
        return self.repository.get_messages(
            conversation_id
        )

    def get_recent_messages(
        self,
        conversation_id: str,
        limit: int = 10
    ) -> list[ChatMessage]:
        """
        Returns the most recent N messages.
        """
        messages = self.repository.get_messages(
            conversation_id
        )

        return messages[-limit:]

    def format_history(
        self,
        conversation_id: str,
        limit: int = 10
    ) -> str:
        """
        Converts conversation history into
        prompt-friendly text.
        """

        messages = self.get_recent_messages(
            conversation_id,
            limit
        )

        formatted_messages = []

        for message in messages:
            formatted_messages.append(
                f"{message.role}: {message.content}"
            )

        return "\n".join(formatted_messages)

    def add_user_message(
        self,
        conversation_id: str,
        content: str
    ) -> None:
        """
        Saves a user message.
        """

        self.repository.save_message(
            conversation_id=conversation_id,
            role="user",
            content=content
        )

    def add_assistant_message(
        self,
        conversation_id: str,
        content: str
    ) -> None:
        """
        Saves an assistant message.
        """

        self.repository.save_message(
            conversation_id=conversation_id,
            role="assistant",
            content=content
        )

    def clear_history(
        self,
        conversation_id: str
    ) -> None:
        """
        Optional feature.
        Requires repository support.
        """

        if hasattr(
            self.repository,
            "delete_messages"
        ):
            self.repository.delete_messages(
                conversation_id
            )