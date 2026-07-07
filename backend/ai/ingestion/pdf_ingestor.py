from pathlib import Path
import fitz
from ai.models.document import Document
from ai.models.source_type import SourceType   # import the enum

def ingest_pdf(path: str) -> Document:
    doc = fitz.open(path)
    pages = []

    for page_num, page in enumerate(doc):
        pages.append(
            {
                "page": page_num + 1,
                "text": page.get_text()
            }
        )

    full_text = "\n".join(page["text"] for page in pages)

    document = Document(
        workspace_id="default_workspace",   
        title=Path(path).name,             
        source_type=SourceType.PDF,       
        content=full_text,
        metadata={
            "page_count": len(pages),
            "pages": pages
        }
    )
    return document , pages  
