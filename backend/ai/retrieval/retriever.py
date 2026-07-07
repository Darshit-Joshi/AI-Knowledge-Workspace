from openai import OpenAI
from ai.vectorstore.pdfstore import VectorStore
from ai.models.retrievalresult import (
    RetrievalResult,
    RetrievedChunk
)
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


class Retriever:

    def __init__(self):
        self.vector_store = VectorStore()

    def retrieve(
        self,
        query: str,
        k: int = 5
    ) -> RetrievalResult:

        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=query
        )

        query_embedding = response.data[0].embedding

        results = self.vector_store.search(
            query_embedding=query_embedding,
            k=k
        )

        chunks = []

        documents = results["documents"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0]

        for doc, metadata, distance in zip(
            documents,
            metadatas,
            distances
        ):

            chunks.append(
                RetrievedChunk(
                    text=doc,
                    score=1 - distance,
                    document_id=metadata["document_id"],
                    chunk_index=metadata["chunk_index"]
                )
            )

        return RetrievalResult(
            query=query,
            chunks=chunks
        )