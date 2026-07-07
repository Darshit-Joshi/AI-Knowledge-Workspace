from pathlib import Path
from ai.models.document import Document
from ai.models.source_type import SourceType


def ingest_text(
    path: str,
    workspace_id: str
) -> Document:

    with open(
        path,
        "r",
        encoding="utf-8"
    ) as f:
        text = f.read()

    return Document(
        workspace_id=workspace_id,
        source_type=SourceType.TEXT,
        title=Path(path).name,
        content=text,
        metadata={}
    )