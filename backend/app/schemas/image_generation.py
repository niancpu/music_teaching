"""
Data models for image generation from audio.
"""
from pydantic import BaseModel
from typing import Literal


class AudioFeatures(BaseModel):
    """Extracted audio features for image generation."""
    tempo: float  # BPM
    energy: float  # 0-1 normalized RMS energy
    valence: float  # 0-1 emotional valence (happy/sad)
    key: str  # Musical key (e.g., "C", "G#")
    mode: Literal["major", "minor"]
    spectral_centroid: float  # Brightness indicator
    mfcc_summary: list[float]  # MFCC coefficients summary


class ImageGenerationRequest(BaseModel):
    """Request model for image generation."""
    audio_path: str  # Relative path to audio file
    style: str = "abstract"  # Visual style for generation
    aspect_ratio: Literal["1:1", "16:9", "9:16"] = "1:1"
    custom_prompt: str | None = None  # Optional custom prompt override
    provider: Literal["openai", "google"] | None = None  # Override default provider


class ImageGenerationSubmitResponse(BaseModel):
    """Response when submitting an image generation task."""
    task_id: str
    message: str = "Task submitted successfully"


class ImageGenerationTask(BaseModel):
    """Task status and result model."""
    task_id: str
    status: Literal["pending", "analyzing", "generating", "completed", "failed"]
    progress: int  # 0-100
    audio_features: AudioFeatures | None = None
    generated_prompt: str | None = None
    image_url: str | None = None
    error: str | None = None
