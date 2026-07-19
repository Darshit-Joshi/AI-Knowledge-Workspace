import asyncio
import os
from qdrant_client import AsyncQdrantClient
from dotenv import load_dotenv

# override=True forces Python to read the .env file fresh, ignoring old cached terminal variables
load_dotenv(override=True)

async def test_connection():
    # .strip("/") safely removes accidental trailing slashes that cause 404s
    raw_url = os.getenv("QDRANT_URL", "")
    clean_url = raw_url.strip().strip("/")
    api_key = os.getenv("QDRANT_API_KEY", "").strip()
    
    print(f"🔍 Attempting to connect to: {clean_url}")
    
    client = AsyncQdrantClient(url=clean_url, api_key=api_key)
    
    try:
        collections = await client.get_collections()
        print("✅ SUCCESS! Qdrant Cloud is connected.")
        print(f"Found collections: {collections.collections}")
    except Exception as e:
        print(f"❌ FAILED! The server rejected the connection.\nError: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())