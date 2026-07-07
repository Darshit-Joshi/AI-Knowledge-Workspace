from enum import Enum

class SourceType(str, Enum):
    PDF = "pdf"
    DOCX = "docx"
    TEXT = "text"
    WEBSITE = "website"
    YOUTUBE = "youtube"
    RESEARCH_PAPER = "research_paper"