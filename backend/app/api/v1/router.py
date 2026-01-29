"""
API v1 router aggregation.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import health, songs, audio, chat, ppt, visualization, image_generation

router = APIRouter(prefix="/api/v1")

router.include_router(health.router, tags=["health"])
router.include_router(songs.router, tags=["songs"])
router.include_router(audio.router, tags=["audio"])
router.include_router(chat.router, tags=["chat"])
router.include_router(ppt.router, tags=["ppt"])
router.include_router(visualization.router, tags=["visualization"])
router.include_router(image_generation.router, tags=["image-generation"])
