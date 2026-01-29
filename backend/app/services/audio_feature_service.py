"""
Audio feature extraction service for image generation.
Extracts tempo, energy, key, valence, spectral features, and MFCC from audio files.
"""
import numpy as np
from pathlib import Path

import librosa

from app.schemas.image_generation import AudioFeatures


# Path to frontend audio files
AUDIO_BASE_PATH = Path(__file__).parent.parent.parent.parent / "frontend" / "public" / "audio"

# Key names for chroma to key conversion
KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def extract_audio_features(audio_path: str) -> AudioFeatures:
    """
    Extract comprehensive audio features for image generation.

    Args:
        audio_path: Relative path to audio file (e.g., "ode-to-joy/total.mp3")

    Returns:
        AudioFeatures with tempo, energy, key, valence, spectral features, and MFCC
    """
    full_path = AUDIO_BASE_PATH / audio_path

    if not full_path.exists():
        raise FileNotFoundError(f"Audio file not found: {full_path}")

    # Load audio file
    y, sr = librosa.load(str(full_path), sr=None)

    # Extract tempo (BPM)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    tempo_value = float(tempo) if np.isscalar(tempo) else float(tempo[0])

    # Extract RMS energy and normalize to 0-1
    rms = librosa.feature.rms(y=y)[0]
    energy = float(np.mean(rms))
    energy_normalized = min(1.0, energy / 0.1)  # Normalize assuming typical max RMS ~0.1

    # Extract chroma features for key detection
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = np.mean(chroma, axis=1)

    # Detect key using Krumhansl-Schmuckler key-finding algorithm
    key_index, mode = _detect_key(chroma_mean)
    key_name = KEY_NAMES[key_index]

    # Estimate valence (emotional positivity) based on mode and tempo
    # Major keys and faster tempos tend to sound happier
    mode_valence = 0.7 if mode == "major" else 0.3
    tempo_valence = min(1.0, (tempo_value - 60) / 120)  # Normalize tempo contribution
    valence = 0.6 * mode_valence + 0.4 * tempo_valence
    valence = max(0.0, min(1.0, valence))

    # Extract spectral centroid (brightness)
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    centroid_mean = float(np.mean(spectral_centroid))

    # Extract MFCC and summarize
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_summary = [float(np.mean(mfcc[i])) for i in range(13)]

    return AudioFeatures(
        tempo=round(tempo_value, 2),
        energy=round(energy_normalized, 4),
        valence=round(valence, 4),
        key=key_name,
        mode=mode,
        spectral_centroid=round(centroid_mean, 2),
        mfcc_summary=[round(m, 4) for m in mfcc_summary]
    )


def _detect_key(chroma_mean: np.ndarray) -> tuple[int, str]:
    """
    Detect musical key using Krumhansl-Schmuckler key profiles.

    Args:
        chroma_mean: Mean chroma vector (12 values)

    Returns:
        Tuple of (key_index, mode) where key_index is 0-11 (C to B)
    """
    # Krumhansl-Schmuckler key profiles
    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

    best_corr = -1
    best_key = 0
    best_mode = "major"

    for i in range(12):
        # Rotate chroma to test each key
        rotated_chroma = np.roll(chroma_mean, -i)

        # Correlate with major profile
        major_corr = np.corrcoef(rotated_chroma, major_profile)[0, 1]
        if major_corr > best_corr:
            best_corr = major_corr
            best_key = i
            best_mode = "major"

        # Correlate with minor profile
        minor_corr = np.corrcoef(rotated_chroma, minor_profile)[0, 1]
        if minor_corr > best_corr:
            best_corr = minor_corr
            best_key = i
            best_mode = "minor"

    return best_key, best_mode
