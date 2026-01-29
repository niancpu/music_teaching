"""
Song service for loading and managing song data.
"""
import json
import os
from pathlib import Path
from app.schemas.song import Song, Track
from app.core.exceptions import NotFoundError


# Path to songs.json in frontend
SONGS_JSON_PATH = Path(__file__).parent.parent.parent.parent / "frontend" / "src" / "data" / "songs.json"


def load_songs() -> list[Song]:
    """Load all songs from songs.json."""
    if not SONGS_JSON_PATH.exists():
        return []

    with open(SONGS_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    songs = []
    for song_data in data.get("songs", []):
        tracks = [Track(**t) for t in song_data.get("tracks", [])]
        song = Song(
            slug=song_data["slug"],
            title=song_data["title"],
            composer=song_data["composer"],
            description=song_data["description"],
            category=song_data["category"],
            icon=song_data["icon"],
            iconColor=song_data["iconColor"],
            totalAudio=song_data["totalAudio"],
            totalScore=song_data.get("totalScore"),
            tracks=tracks,
        )
        songs.append(song)

    return songs


def get_song_by_slug(slug: str) -> Song:
    """Get a song by its slug."""
    songs = load_songs()
    for song in songs:
        if song.slug == slug:
            return song
    raise NotFoundError(f"Song '{slug}' not found", field="slug")


def filter_songs(category: str | None = None) -> list[Song]:
    """Filter songs by category."""
    songs = load_songs()
    if category and category != "all":
        songs = [s for s in songs if s.category == category]
    return songs
