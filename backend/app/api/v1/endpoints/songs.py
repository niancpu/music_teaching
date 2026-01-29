"""
Songs endpoints.
"""
from fastapi import APIRouter, Query
from app.schemas.song import SongListResponse, SongDetailResponse
from app.schemas.common import APIResponse
from app.services import song_service

router = APIRouter()


@router.get("/songs", response_model=APIResponse[SongListResponse])
async def list_songs(
    category: str | None = Query(None, description="Filter by category (classical, folk)")
):
    """Get list of all songs, optionally filtered by category."""
    songs = song_service.filter_songs(category)
    return APIResponse.ok(
        data=SongListResponse(songs=songs, total=len(songs))
    )


@router.get("/songs/{slug}", response_model=APIResponse[SongDetailResponse])
async def get_song(slug: str):
    """Get song details by slug."""
    song = song_service.get_song_by_slug(slug)
    return APIResponse.ok(data=SongDetailResponse(song=song))
