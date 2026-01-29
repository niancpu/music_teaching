"""
Celery tasks for image generation from audio.
"""
import asyncio
from celery import current_task

from app.celery_app import celery_app
from app.services.audio_feature_service import extract_audio_features
from app.services.image_generation_service import (
    get_image_generator,
    build_prompt_from_features
)


@celery_app.task(bind=True, name="generate_image_from_audio")
def generate_image_from_audio(
    self,
    audio_path: str,
    style: str,
    aspect_ratio: str,
    custom_prompt: str | None,
    provider: str | None
) -> dict:
    """
    Celery task to generate an image from audio analysis.

    Args:
        audio_path: Relative path to audio file
        style: Visual style for generation
        aspect_ratio: Image aspect ratio
        custom_prompt: Optional custom prompt override
        provider: Optional provider override

    Returns:
        Dict with task results including image_url and audio_features
    """
    try:
        # Update state: ANALYZING
        self.update_state(
            state="ANALYZING",
            meta={"progress": 10, "status": "analyzing"}
        )

        # Extract audio features
        features = extract_audio_features(audio_path)
        features_dict = features.model_dump()

        # Update state: GENERATING
        self.update_state(
            state="GENERATING",
            meta={
                "progress": 50,
                "status": "generating",
                "audio_features": features_dict
            }
        )

        # Build prompt from features
        prompt = build_prompt_from_features(features, style, custom_prompt)

        # Get image generator and generate image
        generator = get_image_generator(provider)

        # Run async generation in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            image_url = loop.run_until_complete(
                generator.generate(prompt, aspect_ratio)
            )
        finally:
            loop.close()

        # Return success result
        return {
            "status": "completed",
            "progress": 100,
            "audio_features": features_dict,
            "generated_prompt": prompt,
            "image_url": image_url,
            "error": None
        }

    except FileNotFoundError as e:
        return {
            "status": "failed",
            "progress": 0,
            "audio_features": None,
            "generated_prompt": None,
            "image_url": None,
            "error": f"Audio file not found: {str(e)}"
        }
    except Exception as e:
        return {
            "status": "failed",
            "progress": 0,
            "audio_features": None,
            "generated_prompt": None,
            "image_url": None,
            "error": str(e)
        }
