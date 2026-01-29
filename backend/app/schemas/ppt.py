"""
PPT generation schemas.
"""
from pydantic import BaseModel


class PPTMetadata(BaseModel):
    """PPT metadata schema."""

    title: str | None = None
    composer: str | None = None
    scoreImages: list[str] | None = None
    practiceTips: list[str] | None = None
    teacherNotes: str | None = None
    audio: str | None = None
