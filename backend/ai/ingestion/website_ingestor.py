from urllib.parse import urlparse
import trafilatura
from trafilatura.metadata import extract_metadata

from ai.models.document import Document
from ai.models.source_type import SourceType


def ingest_website(
    url: str,
    workspace_id: str
) -> Document:

    downloaded = trafilatura.fetch_url(url)

    if not downloaded:
        raise ValueError("Unable to fetch webpage")

    text = trafilatura.extract(downloaded)

    metadata = extract_metadata(downloaded)

    return Document(
        workspace_id=workspace_id,
        source_type=SourceType.WEBSITE,
        title=metadata.title if metadata else url,
        content=text,
        metadata={
            "url": url,
            "author": metadata.author if metadata else None,
            "site_name": metadata.hostname if metadata else None,
            "date": metadata.date if metadata else None,
        }
    )