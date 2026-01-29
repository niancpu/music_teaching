"""
Song schemas.
"""
from pydantic import BaseModel


class Track(BaseModel):
    """Track schema."""

    id: str
    name: str
    section: str
    icon: str
    audioFile: str
    scoreFile: str | None = None


class Song(BaseModel):
    """Song schema."""

    slug: str
    title: str
    composer: str
    description: str
    category: str
    icon: str
    iconColor: str
    totalAudio: str
    totalScore: str | None = None
    tracks: list[Track]


class SongListResponse(BaseModel):
    """Song list response."""

    songs: list[Song]
    total: int


class SongDetailResponse(BaseModel):
    """Song detail response."""

    song: Song
