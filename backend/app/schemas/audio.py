"""
Audio analysis schemas.
"""
from pydantic import BaseModel
from typing import Any


class AudioAnalysisResult(BaseModel):
    """Audio analysis result from AudD API."""

    status: str
    result: dict[str, Any] | None = None


class ScoreListResponse(BaseModel):
    """Score list response."""

    scores: list[str]
