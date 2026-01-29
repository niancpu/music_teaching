"""
Custom exception handlers.
"""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from datetime import datetime, timezone


class APIError(Exception):
    """Base API error."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        field: str | None = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.field = field
        super().__init__(message)


class NotFoundError(APIError):
    """Resource not found error."""

    def __init__(self, message: str = "Resource not found", field: str | None = None):
        super().__init__(
            code="NOT_FOUND",
            message=message,
            status_code=404,
            field=field,
        )


class ValidationError(APIError):
    """Validation error."""

    def __init__(self, message: str, field: str | None = None):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            status_code=400,
            field=field,
        )


class ExternalServiceError(APIError):
    """External service error."""

    def __init__(self, message: str):
        super().__init__(
            code="EXTERNAL_SERVICE_ERROR",
            message=message,
            status_code=502,
        )


def setup_exception_handlers(app: FastAPI) -> None:
    """Register custom exception handlers."""

    @app.exception_handler(APIError)
    async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
        error_body = {
            "code": exc.code,
            "message": exc.message,
        }
        if exc.field:
            error_body["field"] = exc.field

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": error_body,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
