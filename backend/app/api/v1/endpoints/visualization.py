"""
Visualization API endpoints for audio visualization video generation.
"""
import asyncio
import logging
import threading
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse

from app.schemas.visualization import (
    VisualizationRequest,
    VisualizationTask,
    VisualizationTaskResponse
)
from app.services import task_manager
from app.services.render_service import render_visualization_sync, VIDEO_OUTPUT_DIR


router = APIRouter(prefix="/visualization")
logger = logging.getLogger(__name__)


@router.post("/render", response_model=VisualizationTaskResponse)
async def create_render_task(
    request: VisualizationRequest,
    background_tasks: BackgroundTasks
) -> VisualizationTaskResponse:
    """
    Submit a new visualization render task.

    The task will be processed asynchronously. Use the returned task_id
    to check status via GET /visualization/status/{task_id}.

    Args:
        request: Visualization parameters (audio_path, style, color_scheme, resolution)

    Returns:
        Task ID and confirmation message
    """
    # Create task
    task = task_manager.create_task()
    logger.info(f"Created visualization task: {task.task_id}")
    print(f"[DEBUG] Created visualization task: {task.task_id}")

    # Start render in background thread
    background_tasks.add_task(render_visualization_sync, task.task_id, request)

    return VisualizationTaskResponse(
        task_id=task.task_id,
        message="Render task submitted successfully"
    )


@router.get("/status/{task_id}", response_model=VisualizationTask)
async def get_task_status(task_id: str) -> VisualizationTask:
    """
    Get the status of a visualization render task.

    Args:
        task_id: Task ID returned from POST /render

    Returns:
        Task status including progress and video path when completed
    """
    task = task_manager.get_task(task_id)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


@router.get("/download/{task_id}")
async def download_video(task_id: str) -> FileResponse:
    """
    Download the rendered visualization video.

    Args:
        task_id: Task ID of a completed render task

    Returns:
        Video file (MP4)
    """
    task = task_manager.get_task(task_id)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Task is not completed. Current status: {task.status}"
        )

    video_path = VIDEO_OUTPUT_DIR / f"{task_id}.mp4"

    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    return FileResponse(
        path=str(video_path),
        media_type="video/mp4",
        filename=f"visualization-{task_id}.mp4"
    )


@router.get("/tasks", response_model=list[VisualizationTask])
async def list_tasks() -> list[VisualizationTask]:
    """
    List all visualization tasks.

    Returns:
        List of all tasks with their status
    """
    return task_manager.list_tasks()


@router.delete("/task/{task_id}")
async def delete_task(task_id: str) -> dict:
    """
    Delete a visualization task and its associated files.

    Args:
        task_id: Task ID to delete

    Returns:
        Confirmation message
    """
    from app.services.render_service import cleanup_task_files

    task = task_manager.get_task(task_id)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status in ["analyzing", "rendering"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete task while it is in progress"
        )

    cleanup_task_files(task_id)

    return {"message": f"Task {task_id} deleted successfully"}
