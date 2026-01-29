"""
Celery application configuration for async task processing.
"""
from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "music_teaching",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.image_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    task_time_limit=600,
    result_expires=settings.TASK_RESULT_EXPIRES,
)
