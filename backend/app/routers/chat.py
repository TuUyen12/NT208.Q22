import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import get_settings
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter()
settings = get_settings()

_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash-lite:generateContent"
)

_SYSTEM_PROMPT = """Bạn là chuyên gia Tử Vi Đẩu Số của YinYang — nền tảng chiêm tinh Đông Phương.
Nhiệm vụ của bạn là trả lời các câu hỏi về Tử Vi, vận mệnh, phong thủy và tâm linh Đông phương.
Luôn trả lời bằng tiếng Việt, ngắn gọn, súc tích và dễ hiểu.
Nếu câu hỏi không liên quan đến Tử Vi hoặc tâm linh, hãy nhẹ nhàng hướng người dùng về chủ đề đó."""


class ChatMessage(BaseModel):
    role: str   # "user" | "model"
    text: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str


@router.post("/", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")

    # Build conversation contents for Gemini
    contents = []

    # Inject system prompt as the first user turn (Gemini doesn't have a system role)
    contents.append({
        "role": "user",
        "parts": [{"text": _SYSTEM_PROMPT}],
    })
    contents.append({
        "role": "model",
        "parts": [{"text": "Xin chào! Tôi là chuyên gia Tử Vi của YinYang. Tôi có thể giúp gì cho bạn?"}],
    })

    # Append conversation history
    for msg in body.history[-10:]:   # cap at last 10 turns to stay within token limits
        contents.append({
            "role": msg.role,
            "parts": [{"text": msg.text}],
        })

    # Append current user message
    contents.append({
        "role": "user",
        "parts": [{"text": body.message}],
    })

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{_GEMINI_URL}?key={settings.GEMINI_API_KEY}",
                json={
                    "contents": contents,
                    "generationConfig": {
                        "temperature": 0.8,
                        "maxOutputTokens": 1024,
                    },
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

    try:
        reply = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Unexpected AI response format")

    return ChatResponse(reply=reply.strip())
