"""
API endpoints for image generation from audio.
"""
from fastapi import APIRouter, HTTPException
from celery.result import AsyncResult

from app.celery_app import celery_app
from app.schemas.image_generation import (
    ImageGenerationRequest,
    ImageGenerationSubmitResponse,
    ImageGenerationTask,
    AudioFeatures
)
from app.tasks.image_tasks import generate_image_from_audio


router = APIRouter(prefix="/image-generation")


@router.post("/generate", response_model=ImageGenerationSubmitResponse)
async def submit_generation_task(request: ImageGenerationRequest):
    """
    Submit an image generation task.

    The task will analyze the audio file and generate an image based on
    the extracted features. Use the returned task_id to poll for status.
    """
    task = generate_image_from_audio.delay(
        audio_path=request.audio_path,
        style=request.style,
        aspect_ratio=request.aspect_ratio,
        custom_prompt=request.custom_prompt,
        provider=request.provider
    )

    return ImageGenerationSubmitResponse(
        task_id=task.id,
        message="Task submitted successfully"
    )


@router.get("/status/{task_id}", response_model=ImageGenerationTask)
async def get_task_status(task_id: str):
    """
    Get the status of an image generation task.

    Poll this endpoint to check task progress and retrieve results.
    """
    task_result = AsyncResult(task_id, app=celery_app)

    if task_result.state == "PENDING":
        return ImageGenerationTask(
            task_id=task_id,
            status="pending",
            progress=0
        )

    elif task_result.state == "ANALYZING":
        meta = task_result.info or {}
        return ImageGenerationTask(
            task_id=task_id,
            status="analyzing",
            progress=meta.get("progress", 10)
        )

    elif task_result.state == "GENERATING":
        meta = task_result.info or {}
        audio_features = None
        if meta.get("audio_features"):
            audio_features = AudioFeatures(**meta["audio_features"])
        return ImageGenerationTask(
            task_id=task_id,
            status="generating",
            progress=meta.get("progress", 50),
            audio_features=audio_features
        )

    elif task_result.state == "SUCCESS":
        result = task_result.result or {}
        audio_features = None
        if result.get("audio_features"):
            audio_features = AudioFeatures(**result["audio_features"])

        status = result.get("status", "completed")
        if status == "failed":
            return ImageGenerationTask(
                task_id=task_id,
                status="failed",
                progress=0,
                error=result.get("error")
            )

        return ImageGenerationTask(
            task_id=task_id,
            status="completed",
            progress=100,
            audio_features=audio_features,
            generated_prompt=result.get("generated_prompt"),
            image_url=result.get("image_url")
        )

    elif task_result.state == "FAILURE":
        return ImageGenerationTask(
            task_id=task_id,
            status="failed",
            progress=0,
            error=str(task_result.info) if task_result.info else "Unknown error"
        )

    else:
        # Handle other states (STARTED, RETRY, etc.)
        return ImageGenerationTask(
            task_id=task_id,
            status="pending",
            progress=0
        )


@router.delete("/task/{task_id}")
async def cancel_task(task_id: str):
    """
    Cancel a pending or running image generation task.
    """
    task_result = AsyncResult(task_id, app=celery_app)

    if task_result.state in ["SUCCESS", "FAILURE"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot cancel a completed or failed task"
        )

    task_result.revoke(terminate=True)

    return {"message": "Task cancellation requested", "task_id": task_id}
