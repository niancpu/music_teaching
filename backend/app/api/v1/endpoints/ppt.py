"""
PPT generation endpoints.
"""
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from app.services import ppt_service
from app.core.exceptions import ValidationError

router = APIRouter()


@router.get("/ppt/generate")
async def generate_ppt(song: str = Query(..., description="Song ID")):
    """Generate a PowerPoint presentation for a song."""
    if not song:
        raise ValidationError("Missing song ID", field="song")

    pptx_io, filename = ppt_service.generate_ppt(song)

    return StreamingResponse(
        pptx_io,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )
