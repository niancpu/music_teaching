"""
AudD audio analysis service.
"""
import httpx
from app.config import get_settings
from app.core.exceptions import ExternalServiceError


async def analyze_audio(file_content: bytes, filename: str, content_type: str) -> dict:
    """
    Analyze audio file using AudD API.

    Args:
        file_content: The audio file content
        filename: Original filename
        content_type: MIME type of the file

    Returns:
        Analysis result from AudD API
    """
    settings = get_settings()

    if not settings.AUDD_API_KEY:
        raise ExternalServiceError("AudD API key not configured")

    files = {"file": (filename, file_content, content_type)}
    data = {
        "api_token": settings.AUDD_API_KEY,
        "return": "genre, mood",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                settings.AUDD_API_URL,
                files=files,
                data=data,
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise ExternalServiceError(f"AudD API error: {e.response.status_code}")
    except httpx.RequestError as e:
        raise ExternalServiceError(f"AudD API request failed: {str(e)}")
