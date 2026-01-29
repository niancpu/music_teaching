"""
Render service for generating visualization videos using Remotion.
"""
import asyncio
import json
import logging
import os
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from app.schemas.visualization import VisualizationRequest
from app.services.audio_analysis_service import analyze_audio, save_analysis_to_json, AUDIO_BASE_PATH
from app.services import task_manager


logger = logging.getLogger(__name__)

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
REMOTION_DIR = PROJECT_ROOT / "remotion"
REMOTION_DATA_DIR = REMOTION_DIR / "public" / "data"
REMOTION_AUDIO_DIR = REMOTION_DIR / "public" / "audio"
VIDEO_OUTPUT_DIR = PROJECT_ROOT / "frontend" / "public" / "videos"

# Resolution mappings
RESOLUTION_MAP = {
    "720p": (1280, 720),
    "1080p": (1920, 1080),
    "4k": (3840, 2160)
}

# Thread pool for running subprocess
_executor = ThreadPoolExecutor(max_workers=2)


def _ensure_audio_available(audio_path: str) -> None:
    """
    Ensure audio file is available in Remotion's public directory.
    Creates a copy if needed.

    Args:
        audio_path: Relative path to audio file (e.g., "ode-to-joy/total.mp3")
    """
    source = AUDIO_BASE_PATH / audio_path
    dest = REMOTION_AUDIO_DIR / audio_path

    if dest.exists():
        return

    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, dest)


def _run_remotion_sync(cmd: str, cwd: str) -> tuple[int, str, str]:
    """
    Run Remotion command synchronously in a thread.

    Args:
        cmd: Command to run
        cwd: Working directory

    Returns:
        Tuple of (return_code, stdout, stderr)
    """
    result = subprocess.run(
        cmd,
        shell=True,
        cwd=cwd,
        capture_output=True,
        text=True
    )
    return result.returncode, result.stdout, result.stderr


async def render_visualization(task_id: str, request: VisualizationRequest) -> None:
    """
    Render a visualization video.

    This function:
    1. Analyzes the audio file
    2. Saves analysis data to JSON
    3. Calls Remotion CLI to render the video

    Args:
        task_id: Task ID
        request: Visualization request parameters
    """
    try:
        logger.info(f"Starting render for task {task_id}")

        # Update status to analyzing
        task_manager.update_task(task_id, status="analyzing", progress=10)

        # Analyze audio
        logger.info(f"Analyzing audio: {request.audio_path}")
        analysis = analyze_audio(request.audio_path)
        logger.info(f"Analysis complete: {analysis.total_frames} frames")

        # Save analysis data for Remotion
        REMOTION_DATA_DIR.mkdir(parents=True, exist_ok=True)
        analysis_path = REMOTION_DATA_DIR / f"{task_id}.json"
        save_analysis_to_json(analysis, analysis_path)
        logger.info(f"Saved analysis to {analysis_path}")

        # Ensure audio is available for Remotion
        _ensure_audio_available(request.audio_path)
        logger.info("Audio file copied to Remotion public dir")

        task_manager.update_task(task_id, status="rendering", progress=30)

        # Prepare output path
        VIDEO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        output_path = VIDEO_OUTPUT_DIR / f"{task_id}.mp4"

        # Get resolution
        width, height = RESOLUTION_MAP.get(request.resolution, (1920, 1080))

        # Map style to composition name
        composition_map = {
            "circular": "CircularWaveform",
            "radial": "RadialWaveform",
            "bars": "BarWaveform"
        }
        composition = composition_map.get(request.style, "CircularWaveform")

        # Build Remotion CLI command
        # Audio path relative to remotion/public (without leading slash for staticFile)
        audio_src = f"audio/{request.audio_path}"

        props = {
            "dataFile": f"data/{task_id}.json",
            "audioSrc": audio_src,
            "colorScheme": request.color_scheme
        }

        props_json = json.dumps(props)
        logger.info(f"Props: {props_json}")

        # Build command string
        props_escaped = props_json.replace('"', '\\"')
        cmd = f'npx remotion render {composition} "{output_path}" --props="{props_escaped}" --width={width} --height={height} --codec=h264'
        logger.info(f"Running command: {cmd}")
        logger.info(f"Working directory: {REMOTION_DIR}")

        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        returncode, stdout, stderr = await loop.run_in_executor(
            _executor,
            _run_remotion_sync,
            cmd,
            str(REMOTION_DIR)
        )

        logger.info(f"Process completed with return code: {returncode}")
        if stdout:
            logger.info(f"Stdout: {stdout[:500]}")
        if stderr:
            logger.info(f"Stderr: {stderr[:500]}")

        if returncode != 0:
            error_msg = stderr if stderr else stdout if stdout else "Unknown render error"
            logger.error(f"Render failed: {error_msg}")
            task_manager.update_task(
                task_id,
                status="failed",
                progress=0,
                error=error_msg[:500]
            )
            return

        # Success
        video_url = f"/videos/{task_id}.mp4"
        logger.info(f"Render complete: {video_url}")
        task_manager.update_task(
            task_id,
            status="completed",
            progress=100,
            video_path=video_url
        )

    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        task_manager.update_task(
            task_id,
            status="failed",
            progress=0,
            error=str(e)
        )
    except Exception as e:
        import traceback
        error_detail = f"Render error: {type(e).__name__}: {str(e)}"
        logger.error(f"{error_detail}\n{traceback.format_exc()}")
        task_manager.update_task(
            task_id,
            status="failed",
            progress=0,
            error=error_detail[:500]
        )


async def start_render_task(task_id: str, request: VisualizationRequest) -> None:
    """
    Start a render task with concurrency limiting.

    Args:
        task_id: Task ID
        request: Visualization request parameters
    """
    print(f"[DEBUG] start_render_task called for {task_id}")
    logger.info(f"start_render_task called for {task_id}")

    try:
        async def do_render(tid: str) -> None:
            print(f"[DEBUG] do_render called for {tid}")
            await render_visualization(tid, request)

        await task_manager.run_with_semaphore(task_id, do_render)
    except Exception as e:
        import traceback
        print(f"[DEBUG] Exception in start_render_task: {type(e).__name__}: {e}")
        print(traceback.format_exc())
        logger.error(f"Exception in start_render_task: {type(e).__name__}: {e}")
        task_manager.update_task(
            task_id,
            status="failed",
            progress=0,
            error=f"Start error: {type(e).__name__}: {str(e)}"[:500]
        )


def cleanup_task_files(task_id: str) -> None:
    """
    Clean up files associated with a task.

    Args:
        task_id: Task ID
    """
    # Remove analysis JSON
    analysis_path = REMOTION_DATA_DIR / f"{task_id}.json"
    if analysis_path.exists():
        analysis_path.unlink()

    # Remove video file
    video_path = VIDEO_OUTPUT_DIR / f"{task_id}.mp4"
    if video_path.exists():
        video_path.unlink()

    # Remove task JSON
    task_manager.delete_task(task_id)


def render_visualization_sync(task_id: str, request: VisualizationRequest) -> None:
    """
    Synchronous version of render_visualization for use with BackgroundTasks.

    Args:
        task_id: Task ID
        request: Visualization request parameters
    """
    print(f"[DEBUG] render_visualization_sync called for {task_id}")
    logger.info(f"render_visualization_sync called for {task_id}")

    try:
        # Update status to analyzing
        task_manager.update_task(task_id, status="analyzing", progress=10)

        # Analyze audio
        print(f"[DEBUG] Analyzing audio: {request.audio_path}")
        logger.info(f"Analyzing audio: {request.audio_path}")
        analysis = analyze_audio(request.audio_path)
        print(f"[DEBUG] Analysis complete: {analysis.total_frames} frames")
        logger.info(f"Analysis complete: {analysis.total_frames} frames")

        # Save analysis data for Remotion
        REMOTION_DATA_DIR.mkdir(parents=True, exist_ok=True)
        analysis_path = REMOTION_DATA_DIR / f"{task_id}.json"
        save_analysis_to_json(analysis, analysis_path)
        logger.info(f"Saved analysis to {analysis_path}")

        # Ensure audio is available for Remotion
        _ensure_audio_available(request.audio_path)
        logger.info("Audio file copied to Remotion public dir")

        task_manager.update_task(task_id, status="rendering", progress=30)

        # Prepare output path
        VIDEO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        output_path = VIDEO_OUTPUT_DIR / f"{task_id}.mp4"

        # Get resolution
        width, height = RESOLUTION_MAP.get(request.resolution, (1920, 1080))

        # Map style to composition name
        composition_map = {
            "circular": "CircularWaveform",
            "radial": "RadialWaveform",
            "bars": "BarWaveform"
        }
        composition = composition_map.get(request.style, "CircularWaveform")

        # Build Remotion CLI command
        audio_src = f"audio/{request.audio_path}"

        props = {
            "dataFile": f"data/{task_id}.json",
            "audioSrc": audio_src,
            "colorScheme": request.color_scheme
        }

        props_json = json.dumps(props)
        props_escaped = props_json.replace('"', '\\"')
        cmd = f'npx remotion render {composition} "{output_path}" --props="{props_escaped}" --width={width} --height={height} --codec=h264'

        print(f"[DEBUG] Running command: {cmd}")
        logger.info(f"Running command: {cmd}")
        logger.info(f"Working directory: {REMOTION_DIR}")

        # Run subprocess synchronously
        returncode, stdout, stderr = _run_remotion_sync(cmd, str(REMOTION_DIR))

        print(f"[DEBUG] Process completed with return code: {returncode}")
        logger.info(f"Process completed with return code: {returncode}")
        if stdout:
            print(f"[DEBUG] Stdout: {stdout[:200]}")
            logger.info(f"Stdout: {stdout[:500]}")
        if stderr:
            print(f"[DEBUG] Stderr: {stderr[:200]}")
            logger.info(f"Stderr: {stderr[:500]}")

        if returncode != 0:
            error_msg = stderr if stderr else stdout if stdout else "Unknown render error"
            logger.error(f"Render failed: {error_msg}")
            task_manager.update_task(
                task_id,
                status="failed",
                progress=0,
                error=error_msg[:500]
            )
            return

        # Success
        video_url = f"/videos/{task_id}.mp4"
        print(f"[DEBUG] Render complete: {video_url}")
        logger.info(f"Render complete: {video_url}")
        task_manager.update_task(
            task_id,
            status="completed",
            progress=100,
            video_path=video_url
        )

    except FileNotFoundError as e:
        print(f"[DEBUG] File not found: {e}")
        logger.error(f"File not found: {e}")
        task_manager.update_task(
            task_id,
            status="failed",
            progress=0,
            error=str(e)
        )
    except Exception as e:
        import traceback
        error_detail = f"Render error: {type(e).__name__}: {str(e)}"
        print(f"[DEBUG] {error_detail}")
        print(traceback.format_exc())
        logger.error(f"{error_detail}\n{traceback.format_exc()}")
        task_manager.update_task(
            task_id,
            status="failed",
            progress=0,
            error=error_detail[:500]
        )
