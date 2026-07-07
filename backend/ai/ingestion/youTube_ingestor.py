
from youtube_transcript_api import (
    YouTubeTranscriptApi
)

from ai.models.document import Document
from ai.models.source_type import SourceType


def extract_video_id(url: str):

    if "v=" in url:
        return url.split("v=")[1]

    return url.split("/")[-1]


def ingest_youtube(
    url: str,
    workspace_id: str
) -> Document:

    video_id = extract_video_id(url)

    transcript = (
        YouTubeTranscriptApi
        .get_transcript(video_id)
    )

    text = "\n".join(
        item["text"]
        for item in transcript
    )

    return Document(
        workspace_id=workspace_id,
        source_type=SourceType.YOUTUBE,
        title=f"YouTube-{video_id}",
        content=text,
        metadata={
            "video_id": video_id,
            "url": url
        }
    )