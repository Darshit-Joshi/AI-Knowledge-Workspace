from ai.models.source_type import SourceType

from ai.ingestion.pdf_ingestor import ingest_pdf
from ai.ingestion.docx_ingestor import ingest_docx
from ai.ingestion.text_ingestor import ingest_text
from ai.ingestion.website_ingestor import ingest_website
from ai.ingestion.youTube_ingestor import ingest_youtube
from ai.ingestion.researchpaper_ingestor import ingest_research_paper


INGESTORS = {
    SourceType.PDF: ingest_pdf,
    SourceType.DOCX: ingest_docx,
    SourceType.TEXT: ingest_text,
    SourceType.WEBSITE: ingest_website,
    SourceType.YOUTUBE: ingest_youtube,
    SourceType.RESEARCH_PAPER: ingest_research_paper,
}

