"""
Task manager for visualization rendering tasks.
Uses JSON files for task state persistence.
"""
import asyncio
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Callable, Coroutine, Any

from app.schemas.visualization import VisualizationTask


# Task storage directory
TASKS_DIR = Path(__file__).parent.parent.parent / "data" / "tasks"

# Concurrency limit for rendering
MAX_CONCURRENT_RENDERS = 2
_render_semaphore: asyncio.Semaphore | None = None


def _get_semaphore() -> asyncio.Semaphore:
    """Get or create the render semaphore."""
    global _render_semaphore
    if _render_semaphore is None:
        _render_semaphore = asyncio.Semaphore(MAX_CONCURRENT_RENDERS)
    return _render_semaphore


def _get_task_path(task_id: str) -> Path:
    """Get the file path for a task."""
    return TASKS_DIR / f"{task_id}.json"


def create_task() -> VisualizationTask:
    """
    Create a new visualization task.

    Returns:
        New VisualizationTask with pending status
    """
    TASKS_DIR.mkdir(parents=True, exist_ok=True)

    task_id = str(uuid.uuid4())
    task = VisualizationTask(
        task_id=task_id,
        status="pending",
        progress=0
    )

    _save_task(task)
    return task


def get_task(task_id: str) -> VisualizationTask | None:
    """
    Get a task by ID.

    Args:
        task_id: Task ID

    Returns:
        VisualizationTask or None if not found
    """
    task_path = _get_task_path(task_id)

    if not task_path.exists():
        return None

    with open(task_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return VisualizationTask(**data)


def update_task(
    task_id: str,
    status: str | None = None,
    progress: int | None = None,
    video_path: str | None = None,
    error: str | None = None
) -> VisualizationTask | None:
    """
    Update a task's status.

    Args:
        task_id: Task ID
        status: New status
        progress: New progress (0-100)
        video_path: Path to generated video
        error: Error message if failed

    Returns:
        Updated VisualizationTask or None if not found
    """
    task = get_task(task_id)
    if task is None:
        return None

    if status is not None:
        task.status = status
    if progress is not None:
        task.progress = progress
    if video_path is not None:
        task.video_path = video_path
    if error is not None:
        task.error = error

    _save_task(task)
    return task


def _save_task(task: VisualizationTask) -> None:
    """Save task to JSON file."""
    TASKS_DIR.mkdir(parents=True, exist_ok=True)
    task_path = _get_task_path(task.task_id)

    with open(task_path, "w", encoding="utf-8") as f:
        json.dump(task.model_dump(), f, indent=2)


def delete_task(task_id: str) -> bool:
    """
    Delete a task.

    Args:
        task_id: Task ID

    Returns:
        True if deleted, False if not found
    """
    task_path = _get_task_path(task_id)

    if not task_path.exists():
        return False

    task_path.unlink()
    return True


def list_tasks() -> list[VisualizationTask]:
    """
    List all tasks.

    Returns:
        List of all VisualizationTask objects
    """
    if not TASKS_DIR.exists():
        return []

    tasks = []
    for task_file in TASKS_DIR.glob("*.json"):
        with open(task_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        tasks.append(VisualizationTask(**data))

    return tasks


async def run_with_semaphore(
    task_id: str,
    render_func: Callable[[str], Coroutine[Any, Any, None]]
) -> None:
    """
    Run a render function with concurrency limiting.

    Args:
        task_id: Task ID
        render_func: Async function that performs the rendering
    """
    semaphore = _get_semaphore()

    async with semaphore:
        await render_func(task_id)
