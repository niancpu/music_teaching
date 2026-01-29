"""
Image generation service supporting OpenAI-compatible and Google APIs.
"""
import httpx
from abc import ABC, abstractmethod
from typing import Protocol

from app.config import get_settings
from app.schemas.image_generation import AudioFeatures


class ImageGenerator(Protocol):
    """Protocol for image generators."""
    async def generate(self, prompt: str, aspect_ratio: str) -> str:
        """Generate an image from a prompt and return the image URL."""
        ...


class OpenAIImageGenerator:
    """OpenAI API compatible image generator (DALL-E, etc.)."""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.OPENAI_IMAGE_API_KEY
        self.api_url = settings.OPENAI_IMAGE_API_URL
        self.model = settings.OPENAI_IMAGE_MODEL

    async def generate(self, prompt: str, aspect_ratio: str) -> str:
        """
        Generate an image using OpenAI-compatible API.

        Args:
            prompt: Text prompt for image generation
            aspect_ratio: Aspect ratio ("1:1", "16:9", "9:16")

        Returns:
            URL of the generated image
        """
        # Map aspect ratio to size
        size_map = {
            "1:1": "1024x1024",
            "16:9": "1792x1024",
            "9:16": "1024x1792"
        }
        size = size_map.get(aspect_ratio, "1024x1024")

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.api_url}/images/generations",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "n": 1,
                    "size": size,
                    "response_format": "url"
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["data"][0]["url"]


class GoogleImageGenerator:
    """Google Imagen API image generator."""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.GOOGLE_IMAGE_API_KEY
        self.project_id = settings.GOOGLE_IMAGE_PROJECT_ID

    async def generate(self, prompt: str, aspect_ratio: str) -> str:
        """
        Generate an image using Google Imagen API.

        Args:
            prompt: Text prompt for image generation
            aspect_ratio: Aspect ratio ("1:1", "16:9", "9:16")

        Returns:
            URL or base64 of the generated image
        """
        # Google Imagen API endpoint
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict"

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                endpoint,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": self.api_key
                },
                json={
                    "instances": [{"prompt": prompt}],
                    "parameters": {
                        "sampleCount": 1,
                        "aspectRatio": aspect_ratio.replace(":", ":")
                    }
                }
            )
            response.raise_for_status()
            data = response.json()
            # Return base64 image data with data URI prefix
            image_bytes = data["predictions"][0]["bytesBase64Encoded"]
            return f"data:image/png;base64,{image_bytes}"


def get_image_generator(provider: str | None = None) -> ImageGenerator:
    """
    Factory function to get the appropriate image generator.

    Args:
        provider: Optional provider override ("openai" or "google")

    Returns:
        ImageGenerator instance
    """
    settings = get_settings()
    provider = provider or settings.IMAGE_API_PROVIDER

    if provider == "google":
        return GoogleImageGenerator()
    else:
        return OpenAIImageGenerator()


def build_prompt_from_features(features: AudioFeatures, style: str, custom_prompt: str | None = None) -> str:
    """
    Build an image generation prompt from audio features.

    Args:
        features: Extracted audio features
        style: Visual style (e.g., "abstract", "landscape", "portrait")
        custom_prompt: Optional custom prompt to append

    Returns:
        Generated prompt string
    """
    if custom_prompt:
        return custom_prompt

    # Map tempo to energy description
    if features.tempo < 80:
        tempo_desc = "slow, meditative"
    elif features.tempo < 120:
        tempo_desc = "moderate, flowing"
    elif features.tempo < 150:
        tempo_desc = "energetic, dynamic"
    else:
        tempo_desc = "fast, intense"

    # Map valence to mood
    if features.valence < 0.3:
        mood_desc = "melancholic, introspective"
    elif features.valence < 0.5:
        mood_desc = "contemplative, neutral"
    elif features.valence < 0.7:
        mood_desc = "uplifting, hopeful"
    else:
        mood_desc = "joyful, celebratory"

    # Map energy to visual intensity
    if features.energy < 0.3:
        energy_desc = "soft, subtle"
    elif features.energy < 0.6:
        energy_desc = "balanced, harmonious"
    else:
        energy_desc = "bold, vibrant"

    # Map spectral centroid to color temperature
    if features.spectral_centroid < 2000:
        color_desc = "warm, deep colors"
    elif features.spectral_centroid < 4000:
        color_desc = "balanced color palette"
    else:
        color_desc = "bright, cool colors"

    # Build the prompt
    prompt = f"""Create a {style} visual artwork inspired by music with the following characteristics:
- Rhythm: {tempo_desc} ({features.tempo:.0f} BPM)
- Mood: {mood_desc}
- Energy: {energy_desc}
- Colors: {color_desc}
- Musical key: {features.key} {features.mode}

The artwork should visually represent the emotional and rhythmic qualities of the music,
creating a synesthetic experience that captures the essence of the sound."""

    return prompt
