"""
FastAPI application entry point.
"""
from fastapi import FastAPI
from app.api.v1.router import router as api_v1_router
from app.core.security import setup_cors
from app.core.exceptions import setup_exception_handlers
from app.config import get_settings


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="Music Teaching API",
        description="音乐教学平台 API",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # Setup middleware
    setup_cors(app)

    # Setup exception handlers
    setup_exception_handlers(app)

    # Include routers
    app.include_router(api_v1_router)

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
