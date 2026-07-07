from ai.ingestion.pdf_ingestor import ingest_pdf


def ingest_research_paper(
    path: str,
    workspace_id: str
):
    return ingest_pdf(
        path,
        workspace_id
    )