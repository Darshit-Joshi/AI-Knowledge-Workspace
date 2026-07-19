import asyncio
import os
from dotenv import load_dotenv
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import PayloadSchemaType

load_dotenv(override=True)


async def add_payload_indexes():
    clean_url = os.getenv("QDRANT_URL", "").strip().strip("/")
    api_key = os.getenv("QDRANT_API_KEY", "").strip()
    collection_name = (
        os.getenv("QDRANT_COLLECTION_NAME") or "knowledge_workspaces"
    )

    print(f"🔗 Connecting to Qdrant Cloud collection: '{collection_name}'...")
    client = AsyncQdrantClient(url=clean_url, api_key=api_key)

    try:
        print("⚡ Creating integer index for 'workspace_id'...")
        await client.create_payload_index(
            collection_name=collection_name,
            field_name="workspace_id",
            field_schema=PayloadSchemaType.INTEGER,
        )

        print("⚡ Creating integer index for 'document_id'...")
        await client.create_payload_index(
            collection_name=collection_name,
            field_name="document_id",
            field_schema=PayloadSchemaType.INTEGER,
        )

        print("⚡ Creating keyword index for 'memory_type'...")
        await client.create_payload_index(
            collection_name=collection_name,
            field_name="memory_type",
            field_schema=PayloadSchemaType.KEYWORD,
        )

        print("✅ SUCCESS! Payload indexes created. Your RAG chat is ready!")
    except Exception as e:
        print(f"❌ Error while creating index: {e}")


if __name__ == "__main__":
    asyncio.run(add_payload_indexes())