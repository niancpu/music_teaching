"""
Audio analysis service using librosa for extracting amplitude and spectrum data.
"""
import json
import numpy as np
from pathlib import Path
from typing import Any

import librosa

from app.schemas.visualization import AudioFrameData, AudioAnalysisData


# Path to frontend audio files
AUDIO_BASE_PATH = Path(__file__).parent.parent.parent.parent / "frontend" / "public" / "audio"

# Analysis parameters
DEFAULT_FPS = 30
N_MELS = 128  # Number of mel frequency bands


def analyze_audio(audio_path: str, fps: int = DEFAULT_FPS) -> AudioAnalysisData:
    """
    Analyze audio file and extract frame-by-frame amplitude and spectrum data.

    Args:
        audio_path: Relative path to audio file (e.g., "ode-to-joy/total.mp3")
        fps: Frames per second for analysis (default: 30)

    Returns:
        AudioAnalysisData with frame-by-frame analysis
    """
    full_path = AUDIO_BASE_PATH / audio_path

    if not full_path.exists():
        raise FileNotFoundError(f"Audio file not found: {full_path}")

    # Load audio file
    y, sr = librosa.load(str(full_path), sr=None)
    duration = librosa.get_duration(y=y, sr=sr)

    # Calculate hop length for desired FPS
    hop_length = int(sr / fps)

    # Extract RMS amplitude
    rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]

    # Normalize RMS to 0-1 range
    rms_max = rms.max() if rms.max() > 0 else 1.0
    rms_normalized = rms / rms_max

    # Extract Mel spectrogram
    mel_spec = librosa.feature.melspectrogram(
        y=y,
        sr=sr,
        n_mels=N_MELS,
        hop_length=hop_length
    )

    # Convert to dB scale and normalize
    mel_db = librosa.power_to_db(mel_spec, ref=np.max)
    # Normalize to 0-1 range (mel_db is typically -80 to 0)
    mel_normalized = (mel_db + 80) / 80
    mel_normalized = np.clip(mel_normalized, 0, 1)

    # Build frame data
    frames: list[AudioFrameData] = []
    total_frames = min(len(rms_normalized), mel_normalized.shape[1])

    for i in range(total_frames):
        time = i / fps
        amplitude = float(rms_normalized[i])
        spectrum = mel_normalized[:, i].tolist()

        frames.append(AudioFrameData(
            time=round(time, 4),
            amplitude=round(amplitude, 4),
            spectrum=[round(s, 4) for s in spectrum]
        ))

    return AudioAnalysisData(
        duration=round(duration, 2),
        fps=fps,
        total_frames=total_frames,
        frames=frames
    )


def save_analysis_to_json(analysis: AudioAnalysisData, output_path: Path) -> None:
    """
    Save audio analysis data to JSON file.

    Args:
        analysis: AudioAnalysisData to save
        output_path: Path to output JSON file
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(analysis.model_dump(), f)


def get_audio_duration(audio_path: str) -> float:
    """
    Get duration of audio file in seconds.

    Args:
        audio_path: Relative path to audio file

    Returns:
        Duration in seconds
    """
    full_path = AUDIO_BASE_PATH / audio_path

    if not full_path.exists():
        raise FileNotFoundError(f"Audio file not found: {full_path}")

    return librosa.get_duration(path=str(full_path))
