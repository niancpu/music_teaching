"""
Audio analysis endpoints.
"""
import os
from pathlib import Path
from fastapi import APIRouter, UploadFile, File
from app.schemas.audio import ScoreListResponse
from app.schemas.common import APIResponse
from app.services import audd_service
from app.core.exceptions import ValidationError

router = APIRouter()

# Path to scores directory
SCORES_DIR = Path(__file__).parent.parent.parent.parent.parent.parent / "frontend" / "public" / "scores"


@router.post("/audio/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    """Analyze uploaded audio file using AudD API."""
    if not file.filename:
        raise ValidationError("No file uploaded", field="file")

    content = await file.read()
    result = await audd_service.analyze_audio(
        file_content=content,
        filename=file.filename,
        content_type=file.content_type or "audio/mpeg",
    )
    return APIResponse.ok(data=result)


@router.get("/scores", response_model=APIResponse[ScoreListResponse])
async def list_scores():
    """List available score files."""
    if not SCORES_DIR.exists():
        return APIResponse.ok(data=ScoreListResponse(scores=[]))

    files = [
        f for f in os.listdir(SCORES_DIR)
        if os.path.isfile(SCORES_DIR / f)
    ]
    return APIResponse.ok(data=ScoreListResponse(scores=files))
