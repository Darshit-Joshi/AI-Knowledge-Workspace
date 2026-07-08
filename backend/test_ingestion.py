import warnings


# Suppress only SyntaxWarnings from transformers
warnings.filterwarnings(
    "ignore",
    category=SyntaxWarning,
    module="transformers.dynamic_module_utils"
)


from backend.ai.embeddings.embedded_chunk import generate_embeddings
from backend.ai.chunking.text_chunker import create_chunks
from ai.ingestion.pdf_ingestor import ingest_pdf
from backend.ai.vectorstore.vector_store import VectorStore
from ai.retrieval import retriever
from ai.rag.rag_service import RAGService


doc, pages = ingest_pdf("Attention.pdf")

print("Title:", doc.title)
print("Source Type:", doc.source_type)
print("Pages:", doc.metadata["page_count"])
print("Content Preview:")
print(doc.content[:500])

chunks = create_chunks(
    doc,
    pages=pages
)

print(chunks[0])

embedded_chunks = generate_embeddings(chunks)
print(embedded_chunks[0])

vector_store = VectorStore()

vector_store.store_chunks(embedded_chunks)

results = vector_store.search(
    query_embedding=embedded_chunks[0].embedding,
    k=5
)

print(results["documents"][0])


retriever = retriever.Retriever()

result = retriever.retrieve(
    query="What is self-attention?",
    k=5
)

print(result)


rag = RAGService()

result = rag.answer_question(
    "What is self-attention?"
)

print(result.answer)

for source in result.sources:
    print(source)

