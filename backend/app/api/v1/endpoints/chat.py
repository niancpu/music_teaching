"""
Chat endpoints.
"""
from fastapi import APIRouter
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.common import APIResponse
from app.services import ai_service

router = APIRouter()


@router.post("/chat", response_model=APIResponse[ChatResponse])
async def chat(request: ChatRequest):
    """AI chat endpoint."""
    reply = await ai_service.generate_reply(
        user_text=request.message,
        system_prompt=request.system_prompt,
    )
    return APIResponse.ok(data=ChatResponse(reply=reply))
