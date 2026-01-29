"""
Common response schemas.
"""
from pydantic import BaseModel
from typing import TypeVar, Generic
from datetime import datetime, timezone

T = TypeVar("T")


class ErrorDetail(BaseModel):
    """Error detail schema."""

    code: str
    message: str
    field: str | None = None


class APIResponse(BaseModel, Generic[T]):
    """Standard API response wrapper."""

    success: bool
    data: T | None = None
    error: ErrorDetail | None = None
    message: str | None = None
    timestamp: datetime

    @classmethod
    def ok(cls, data: T, message: str | None = None) -> "APIResponse[T]":
        """Create a successful response."""
        return cls(
            success=True,
            data=data,
            message=message,
            timestamp=datetime.now(timezone.utc),
        )

    @classmethod
    def fail(
        cls,
        code: str,
        message: str,
        field: str | None = None,
    ) -> "APIResponse[None]":
        """Create a failed response."""
        return cls(
            success=False,
            error=ErrorDetail(code=code, message=message, field=field),
            timestamp=datetime.now(timezone.utc),
        )
