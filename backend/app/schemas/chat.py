"""
Chat schemas.
"""
from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Chat request schema."""

    message: str
    system_prompt: str | None = None


class ChatResponse(BaseModel):
    """Chat response schema."""

    reply: str
