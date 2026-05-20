import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel

from app.core.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.chart import Chart
from app.models.user import User
from app.services.ai_service import _summarise_matrix

router = APIRouter()
settings = get_settings()

_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash-lite:generateContent"
)

_BASE_SYSTEM_PROMPT = """Bạn là chuyên gia Tử Vi Đẩu Số của YinYang — nền tảng chiêm tinh Đông Phương.
Nhiệm vụ của bạn là trả lời các câu hỏi về Tử Vi, vận mệnh, phong thủy và tâm linh Đông phương.
Luôn trả lời bằng tiếng Việt, ngắn gọn, súc tích và dễ hiểu.
Nếu câu hỏi không liên quan đến Tử Vi hoặc tâm linh, hãy nhẹ nhàng hướng người dùng về chủ đề đó."""


def _build_system_prompt(chart: Chart | None) -> str:
    if chart is None:
        return _BASE_SYSTEM_PROMPT

    parts = [_BASE_SYSTEM_PROMPT, f"\n\nBạn đang tư vấn cho: {chart.name} ({chart.gender})."]

    parts.append("\n=== LÁ SỐ TỬ VI CỦA NGƯỜI DÙNG ===")
    parts.append(_summarise_matrix(chart.chart_matrix))
    parts.append("=== KẾT THÚC LÁ SỐ ===")

    if chart.ai_interpretation:
        ai = chart.ai_interpretation
        if ai.get("overall"):
            parts.append(f"\nTóm tắt luận giải lá số:\n{ai['overall']}")

    parts.append(
        "\nDựa trên lá số trên, hãy trả lời câu hỏi của người dùng một cách cá nhân hóa, "
        "đề cập đến các sao và cung cụ thể trong lá số của họ khi phù hợp."
    )
    return "\n".join(parts)


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
    db: AsyncSession = Depends(get_db),
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")

    # Load user's latest chart for personalized context
    result = await db.execute(
        select(Chart)
        .where(Chart.user_id == current_user.user_id)
        .order_by(Chart.created_at.desc())
        .limit(1)
    )
    latest_chart = result.scalar_one_or_none()

    system_prompt = _build_system_prompt(latest_chart)

    # Build conversation contents for Gemini
    contents = [
        {"role": "user", "parts": [{"text": system_prompt}]},
        {"role": "model", "parts": [{"text": "Xin chào! Tôi là chuyên gia Tử Vi của YinYang. Tôi có thể giúp gì cho bạn?"}]},
    ]

    for msg in body.history[-10:]:
        contents.append({"role": msg.role, "parts": [{"text": msg.text}]})

    contents.append({"role": "user", "parts": [{"text": body.message}]})

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
