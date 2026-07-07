from langchain_text_splitters import RecursiveCharacterTextSplitter
from ai.models.chunk import Chunk
from ai.models.document import Document
from pathlib import Path

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100,
    separators=["\n\n", "\n", ".", " ", ""]
)

def create_pdf_chunks(
    document: Document,
    pages: list[dict]
) -> list[Chunk]:
    chunks = []
    chunk_index = 0

    for page in pages:
        page_number = page["page"]
        page_text = page["text"]

        split_chunks = splitter.split_text(page_text)

        for text_chunk in split_chunks:
            chunks.append(
                Chunk(
                    document_id=document.id,
                    chunk_index=chunk_index,
                    text=text_chunk,
                    metadata={
                        "page": page_number,
                        "source_type": document.source_type.value,
                        "document_title": document.title 
                    }
                )
            )
            chunk_index += 1

    return chunks
