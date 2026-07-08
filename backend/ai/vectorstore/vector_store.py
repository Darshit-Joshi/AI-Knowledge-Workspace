import chromadb
from typing import List

from ai.models.chunk import Chunk


class VectorStore:

    def __init__(
        self,
        collection_name: str = "knowledge_base",
        persist_directory: str = "./chroma_db"
    ):

        self.client = chromadb.PersistentClient(
            path=persist_directory
        )

        self.collection = self.client.get_or_create_collection(
            name=collection_name
        )

    def store_chunks(
        self,
        chunks: List[Chunk]
    ):

        ids = []
        documents = []
        embeddings = []
        metadatas = []

        for chunk in chunks:

            if chunk.embedding is None:
                continue

            ids.append(chunk.id)
            documents.append(chunk.text)
            embeddings.append(chunk.embedding)

            metadatas.append(
                {
                    "document_id": chunk.document_id,
                    "chunk_index": chunk.chunk_index,
                    **chunk.metadata
                }
            )

        if ids:
            self.collection.add(
                ids=ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas
            )

    def search(
        self,
        query_embedding: List[float],
        k: int = 5
    ):

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k
        )

        return results

    def delete_document(
        self,
        document_id: str
    ):

        self.collection.delete(
            where={
                "document_id": document_id
            }
        )

    def count(self):

        return self.collection.count()

