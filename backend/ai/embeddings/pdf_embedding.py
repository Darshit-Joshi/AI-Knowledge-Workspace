from openai import OpenAI
from ai.models.chunk import Chunk
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

def generate_embeddings(
    chunks: List[Chunk]
) -> List[Chunk]:

    texts = [chunk.text for chunk in chunks]

    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )

    for chunk, embedding in zip(
        chunks,
        response.data
    ):
        chunk.embedding = embedding.embedding

    return chunks