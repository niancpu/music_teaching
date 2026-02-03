"""
Visualization schemas for audio analysis and video rendering.
"""
from pydantic import BaseModel
from typing import Literal


class AudioFrameData(BaseModel):
    """Single frame of audio analysis data."""
    time: float           # Timestamp in seconds
    amplitude: float      # RMS amplitude (0-1)
    spectrum: list[float] # Spectrum data (128 frequency bands)


class AudioAnalysisData(BaseModel):
    """Complete audio analysis result."""
    duration: float       # Total duration in seconds
    fps: int              # Frame rate (30)
    total_frames: int
    frames: list[AudioFrameData]


class VisualizationRequest(BaseModel):
    """Request to create a visualization video."""
    audio_path: str       # Relative path to audio file (e.g., "ode-to-joy/total.mp3")
    style: Literal["circular", "radial", "bars", "particle"] = "circular"
    color_scheme: str = "blue"
    resolution: Literal["720p", "1080p", "4k"] = "1080p"


class VisualizationTask(BaseModel):
    """Visualization task status."""
    task_id: str
    status: Literal["pending", "analyzing", "rendering", "completed", "failed"]
    progress: int = 0     # 0-100
    video_path: str | None = None
    error: str | None = None


class VisualizationTaskResponse(BaseModel):
    """Response when creating a visualization task."""
    task_id: str
    message: str
