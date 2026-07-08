from ai.chunking.text_chunker import create_chunks
from backend.ai.embeddings.embedded_chunk import generate_embeddings
from ai.vectorstore.vector_store import VectorStore 


class IngestionPipeline:

    def __init__(self):
        self.vector_store = VectorStore()

    def process_document(self, document):

        chunks = create_chunks(document)

        embedded_chunks = generate_embeddings(
            chunks
        )

        self.vector_store.add(
            embedded_chunks
        )

        return {
            "document_id": document.id,
            "chunk_count": len(chunks)
        }