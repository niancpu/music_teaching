"""
AI chat service.
"""
import httpx
from app.config import get_settings
from app.core.exceptions import ExternalServiceError

DEFAULT_SYSTEM_PROMPT = (
    "你是一个专业的音乐教学助手，可以帮助用户分析乐曲、"
    "解答音乐理论问题、提供演奏建议等。请用简洁友好的语言回答问题。"
)


async def generate_reply(
    user_text: str,
    system_prompt: str | None = None,
) -> str:
    """
    Generate AI chat reply.

    Args:
        user_text: User's message
        system_prompt: Optional custom system prompt

    Returns:
        AI generated reply
    """
    settings = get_settings()

    if not settings.AI_API_KEY:
        raise ExternalServiceError("AI API key not configured")
    if not settings.AI_BASE_URL:
        raise ExternalServiceError("AI API base URL not configured")
    if not settings.AI_MODEL:
        raise ExternalServiceError("AI model not configured")

    url = f"{settings.AI_BASE_URL}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.AI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.AI_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt or DEFAULT_SYSTEM_PROMPT},
            {"role": "user", "content": user_text},
        ],
        "temperature": 0.7,
        "max_tokens": 1024,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as e:
        raise ExternalServiceError(f"AI API error: {e.response.status_code}")
    except httpx.RequestError as e:
        raise ExternalServiceError(f"AI API request failed: {str(e)}")
    except (KeyError, IndexError) as e:
        raise ExternalServiceError(f"Failed to parse AI response: {str(e)}")
