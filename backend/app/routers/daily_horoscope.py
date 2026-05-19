"""Daily Horoscope router — generates a personalised daily horoscope using Gemini AI.

Endpoint:  GET /api/v1/daily-horoscope/
- Requires a valid JWT (Bearer token).
- Loads the user's latest chart for personalised context.
- Caches the response in Redis for the rest of the calendar day (UTC)
  so repeated calls within the same day return instantly without hitting Gemini.
- Falls back to a generic horoscope if the user has no chart.
"""

from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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

# ---------------------------------------------------------------------------
# Prompt helpers
# ---------------------------------------------------------------------------

def _build_horoscope_prompt(chart: Chart | None, today: str) -> str:
    """Build the Gemini prompt for daily horoscope generation."""

    base = (
        "Bạn là chuyên gia Tử Vi Đẩu Số của YinYang — nền tảng chiêm tinh Đông Phương.\n"
        "Hãy viết tử vi hàng ngày bằng tiếng Việt, ngắn gọn (khoảng 150–200 từ), "
        "tích cực, cá nhân hóa và dễ hiểu. Chia thành các mục: "
        "Tổng quan, Sự nghiệp & Tài chính, Tình duyên, Sức khỏe, Màu sắc may mắn hôm nay."
    )

    if chart is None:
        return (
            f"{base}\n\n"
            f"Ngày: {today}\n"
            "Người dùng chưa có lá số Tử Vi. Hãy viết tử vi tổng quát cho ngày hôm nay."
        )

    parts = [
        base,
        f"\nNgày: {today}",
        f"Đang luận giải cho: {chart.name} ({chart.gender}).",
        "\n=== LÁ SỐ TỬ VI ===",
        _summarise_matrix(chart.chart_matrix),
        "=== KẾT THÚC LÁ SỐ ===",
    ]

    if chart.ai_interpretation and chart.ai_interpretation.get("overall"):
        parts.append(f"\nTóm tắt lá số: {chart.ai_interpretation['overall']}")

    parts.append(
        "\nDựa trên lá số trên, hãy viết tử vi hàng ngày cá nhân hóa, "
        "đề cập đến các sao và cung cụ thể trong lá số khi phù hợp."
    )

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Redis helpers
# ---------------------------------------------------------------------------

def _cache_key(user_id: str, date_str: str) -> str:
    return f"horoscope:{user_id}:{date_str}"


def _seconds_until_midnight_utc() -> int:
    """Seconds remaining until 00:00 UTC (cache TTL)."""
    now = datetime.now(timezone.utc)
    midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return max(int((midnight - now).total_seconds()), 1)


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------

class HoroscopeResponse(BaseModel):
    date: str
    horoscope: str
    cached: bool
    personalized: bool


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.get("/", response_model=HoroscopeResponse)
async def get_daily_horoscope(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return today's daily horoscope for the current user."""

    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cache_key = _cache_key(str(current_user.user_id), today)

    # --- Try Redis cache first ---
    redis = request.app.state.redis
    cached = await redis.get(cache_key)
    if cached:
        return HoroscopeResponse(
            date=today,
            horoscope=cached,
            cached=True,
            personalized=True,
        )

    # --- Load user's latest chart ---
    result = await db.execute(
        select(Chart)
        .where(Chart.user_id == current_user.user_id)
        .order_by(Chart.created_at.desc())
        .limit(1)
    )
    latest_chart = result.scalar_one_or_none()
    personalized = latest_chart is not None

    # --- Build prompt & call Gemini ---
    prompt = _build_horoscope_prompt(latest_chart, today)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{_GEMINI_URL}?key={settings.GEMINI_API_KEY}",
                json={
                    "contents": [
                        {"role": "user", "parts": [{"text": prompt}]}
                    ],
                    "generationConfig": {
                        "temperature": 0.85,
                        "maxOutputTokens": 1024,
                    },
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

    try:
        horoscope_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Unexpected AI response format")

    # --- Cache until midnight UTC ---
    ttl = _seconds_until_midnight_utc()
    await redis.setex(cache_key, ttl, horoscope_text)

    return HoroscopeResponse(
        date=today,
        horoscope=horoscope_text,
        cached=False,
        personalized=personalized,
    )
