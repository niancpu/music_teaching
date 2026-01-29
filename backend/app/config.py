"""
Application configuration using Pydantic Settings.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # AudD API for audio analysis
    AUDD_API_KEY: str = ""
    AUDD_API_URL: str = "https://api.audd.io/analysis/"

    # AI Chat API
    AI_API_KEY: str = ""
    AI_BASE_URL: str = ""
    AI_MODEL: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Application
    DEBUG: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Image Generation API
    IMAGE_API_PROVIDER: str = "openai"  # "openai" | "google"

    # OpenAI Compatible API
    OPENAI_IMAGE_API_KEY: str = ""
    OPENAI_IMAGE_API_URL: str = "https://api.openai.com/v1"
    OPENAI_IMAGE_MODEL: str = "dall-e-3"

    # Google API
    GOOGLE_IMAGE_API_KEY: str = ""
    GOOGLE_IMAGE_PROJECT_ID: str = ""

    # Task Configuration
    TASK_RESULT_EXPIRES: int = 86400
    MAX_CONCURRENT_IMAGE_TASKS: int = 3

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
