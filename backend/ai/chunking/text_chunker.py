from langchain_text_splitters import RecursiveCharacterTextSplitter

from ai.models.chunk import Chunk
from ai.models.document import Document


splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100,
    separators=["\n\n", "\n", ".", " ", ""]
)


def create_chunks(
    document: Document
) -> list[Chunk]:

    texts = splitter.split_text(
        document.content
    )

    chunks = []

    for idx, text in enumerate(texts):

        chunks.append(
            Chunk(
                document_id=document.id,
                chunk_index=idx,
                text=text,
                metadata={
                    "source_type": document.source_type.value,
                    "document_title": document.title
                }
            )
        )

    return chunks