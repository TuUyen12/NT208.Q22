"""Daily Horoscope router.

GET /api/v1/daily-horoscope/
- JWT required.
- Loads the user's latest chart for personalised context.
- Gemini returns structured JSON (sections: tong_quan, nen_lam, nen_tranh, gio_tot, …).
- Horoscope JSON cached in Redis until midnight UTC.
- Streak: one checkin per user per calendar day (UTC); consecutive days increment streak_count.
"""

import json
from datetime import date, datetime, timedelta, timezone

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

# Can Chi lookup tables
_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"]
_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
_HANH = ["Mộc", "Mộc", "Hỏa", "Hỏa", "Thổ", "Thổ", "Kim", "Kim", "Thủy", "Thủy"]  # hành theo Can
_TRUC = ["Kiến", "Trừ", "Mãn", "Bình", "Định", "Chấp", "Phá", "Nguy", "Thành", "Thu", "Khai", "Bế"]
# Giờ Hoàng Đạo theo Chi ngày (index = Chi ngày % 12)
# Mỗi phần tử: danh sách 6 Chi giờ hoàng đạo
_GIO_HOANG_DAO = {
    0:  [0, 1, 3, 6, 7, 9],   # Tý ngày
    1:  [1, 2, 4, 7, 8, 10],  # Sửu ngày
    2:  [2, 3, 5, 8, 9, 11],  # Dần ngày
    3:  [0, 3, 4, 6, 9, 10],  # Mão ngày
    4:  [1, 4, 5, 7, 10, 11], # Thìn ngày
    5:  [0, 2, 5, 6, 8, 11],  # Tỵ ngày
    6:  [0, 1, 3, 6, 7, 9],   # Ngọ ngày (giống Tý)
    7:  [1, 2, 4, 7, 8, 10],  # Mùi ngày
    8:  [2, 3, 5, 8, 9, 11],  # Thân ngày
    9:  [0, 3, 4, 6, 9, 10],  # Dậu ngày
    10: [1, 4, 5, 7, 10, 11], # Tuất ngày
    11: [0, 2, 5, 6, 8, 11],  # Hợi ngày
}
_GIO_NAMES = [
    ("Tý",   "23:00–01:00"), ("Sửu", "01:00–03:00"), ("Dần",  "03:00–05:00"),
    ("Mão",  "05:00–07:00"), ("Thìn", "07:00–09:00"), ("Tỵ",  "09:00–11:00"),
    ("Ngọ", "11:00–13:00"), ("Mùi",  "13:00–15:00"), ("Thân","15:00–17:00"),
    ("Dậu", "17:00–19:00"), ("Tuất", "19:00–21:00"), ("Hợi", "21:00–23:00"),
]
_WEEKDAYS_VN = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]


def _jdn(y: int, m: int, d: int) -> int:
    a = (14 - m) // 12
    yy = y + 4800 - a
    mm = m + 12 * a - 3
    return d + (153 * mm + 2) // 5 + 365 * yy + yy // 4 - yy // 100 + yy // 400 - 32045


def _get_day_metadata(d: date) -> dict:
    """Tính Can Chi ngày, trực ngày, giờ Hoàng Đạo dựa trên ngày dương lịch.
    Công thức: (JDN + 49) % 60 = vị trí trong chu kỳ lục thập hoa giáp.
    Đã xác minh: 2024-01-01 = Giáp Tý (pos 0); 2024-02-10 (Tết Giáp Thìn) = Giáp Thìn (pos 4).
    """
    pos = (_jdn(d.year, d.month, d.day) + 49) % 60
    can_idx = pos % 10
    chi_idx = pos % 12
    hanh = _HANH[can_idx]
    truc = _TRUC[chi_idx]

    gio_hd_indices = _GIO_HOANG_DAO[chi_idx]
    gio_hd = [f"Giờ {_GIO_NAMES[i][0]} ({_GIO_NAMES[i][1]})" for i in gio_hd_indices[:4]]

    return {
        "thu": _WEEKDAYS_VN[d.weekday()],
        "can_chi": f"{_CAN[can_idx]} {_CHI[chi_idx]}",
        "hanh_can": hanh,
        "truc": truc,
        "gio_hoang_dao": gio_hd,
    }

router = APIRouter()
settings = get_settings()

_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash-lite:generateContent"
)

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

def _build_prompt(chart: Chart | None, today: str) -> str:
    d = date.fromisoformat(today)
    meta = _get_day_metadata(d)
    can_chi = meta["can_chi"]
    hanh = meta["hanh_can"]
    truc = meta["truc"]
    chi = can_chi.split()[1]
    gio_hd_str = ", ".join(meta["gio_hoang_dao"])

    base = (
        f"Bạn là chuyên gia Tử Vi Đẩu Số và lịch vạn niên của YinYang.\n\n"
        f"=== THÔNG TIN NGÀY ===\n"
        f"Dương lịch : {meta['thu']}, {today}\n"
        f"Can Chi ngày: {can_chi} (hành {hanh})\n"
        f"Trực ngày   : {truc}\n"
        f"Giờ Hoàng Đạo: {gio_hd_str}\n"
        f"=====================\n\n"
        f"Viết tử vi hàng ngày bằng tiếng Việt. "
        f"Nội dung BẮT BUỘC bám sát đặc trưng riêng của ngày {can_chi} — "
        f"trực {truc} — hành {hanh}. "
        f"KHÔNG viết sáo rỗng hay có thể áp dụng cho bất kỳ ngày nào khác.\n\n"
        f"Quy tắc từng trường:\n"
        f'• "tong_quan": 2–3 câu, phải đề cập Can Chi {can_chi} và trực {truc}; '
        f"giải thích vận thế ĐẶC THÙ của ngày này (tốt hay xấu ở điểm nào).\n"
        f'• "nen_lam": 3 việc cụ thể phù hợp với hành {hanh} và trực {truc}.\n'
        f'• "nen_tranh": 3 việc cụ thể bất lợi theo đặc tính của trực {truc} hoặc Can Chi {can_chi}.\n'
        f'• "gio_tot": liệt kê đúng 3 giờ trong số [{gio_hd_str}], '
        f"mỗi giờ kèm lý do ngắn gọn tại sao tốt cho ngày này.\n"
        f'• "mau_may_man": màu thuộc hành {hanh} hoặc hành tương sinh với {hanh}.\n'
        f'• "con_so_may_man": 2–3 số hợp với hành {hanh} và Chi {chi}.\n'
        f'• "loi_khuyen": 1–2 câu lời khuyên thực tế, cụ thể cho ngày {can_chi} này.\n\n'
        f"Trả về MỘT JSON object hợp lệ (không markdown, không text thêm):\n"
        f'{{\n'
        f'  "tong_quan": "...",\n'
        f'  "nen_lam": ["...", "...", "..."],\n'
        f'  "nen_tranh": ["...", "...", "..."],\n'
        f'  "gio_tot": ["Giờ X (HH:MM–HH:MM) — lý do", "...", "..."],\n'
        f'  "mau_may_man": "...",\n'
        f'  "con_so_may_man": "...",\n'
        f'  "loi_khuyen": "..."\n'
        f"}}"
    )

    if chart is None:
        return base + "\n\nNgười dùng chưa có lá số Tử Vi. Viết tử vi tổng quát theo ngày."

    parts = [
        base,
        f"\nLuận giải riêng cho: {chart.name} ({chart.gender}).",
        "\n=== LÁ SỐ TỬ VI ===",
        _summarise_matrix(chart.chart_matrix),
        "=== KẾT THÚC LÁ SỐ ===",
    ]
    if chart.ai_interpretation and chart.ai_interpretation.get("overall"):
        parts.append(f"\nTóm tắt lá số: {chart.ai_interpretation['overall']}")
    parts.append(
        f"\nKết hợp lá số với đặc trưng ngày {can_chi} hôm nay — đề cập sao/cung ảnh hưởng đến vận ngày."
    )
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Redis helpers
# ---------------------------------------------------------------------------

def _horoscope_key(user_id: str, date_str: str) -> str:
    return f"horoscope:{user_id}:{date_str}"

def _checkin_key(user_id: str, date_str: str) -> str:
    return f"checkin:{user_id}:{date_str}"

def _seconds_until_midnight_utc() -> int:
    now = datetime.now(timezone.utc)
    midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return max(int((midnight - now).total_seconds()), 1)


# ---------------------------------------------------------------------------
# Streak logic
# ---------------------------------------------------------------------------

async def _update_streak(redis, db: AsyncSession, user: User, today: str) -> int:
    """
    Increments streak if this is the user's first checkin today.
    Returns the up-to-date streak count.
    """
    checkin_today = _checkin_key(str(user.user_id), today)
    already = await redis.exists(checkin_today)
    if already:
        return user.streak_count

    yesterday = (date.fromisoformat(today) - timedelta(days=1)).isoformat()
    checkin_yesterday = _checkin_key(str(user.user_id), yesterday)
    had_yesterday = await redis.exists(checkin_yesterday)

    new_streak = (user.streak_count + 1) if had_yesterday else 1

    # Persist to DB
    result = await db.execute(select(User).where(User.user_id == user.user_id))
    db_user = result.scalar_one()
    db_user.streak_count = new_streak
    await db.commit()

    # Mark today's checkin (TTL = 48h to survive past midnight safely)
    await redis.setex(checkin_today, 48 * 3600, "1")

    return new_streak


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------

class HoroscopeResponse(BaseModel):
    date: str
    tong_quan: str
    nen_lam: list[str]
    nen_tranh: list[str]
    gio_tot: list[str]
    mau_may_man: str
    con_so_may_man: str
    loi_khuyen: str
    cached: bool
    personalized: bool
    streak: int


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.get("/", response_model=HoroscopeResponse)
async def get_daily_horoscope(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    redis = request.app.state.redis

    # Update streak (idempotent — only counts once per day)
    streak = await _update_streak(redis, db, current_user, today)

    # Try horoscope cache
    cache_key = _horoscope_key(str(current_user.user_id), today)
    cached_raw = await redis.get(cache_key)
    if cached_raw:
        try:
            data = json.loads(cached_raw)
            return HoroscopeResponse(**data, date=today, cached=True, streak=streak)
        except Exception:
            pass  # corrupt cache — regenerate below

    # Load latest chart
    result = await db.execute(
        select(Chart)
        .where(Chart.user_id == current_user.user_id)
        .order_by(Chart.created_at.desc())
        .limit(1)
    )
    latest_chart = result.scalar_one_or_none()
    personalized = latest_chart is not None

    # Call Gemini
    prompt = _build_prompt(latest_chart, today)
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{_GEMINI_URL}?key={settings.GEMINI_API_KEY}",
                json={
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.9, "maxOutputTokens": 1500},
                },
            )
            resp.raise_for_status()
            gemini_data = resp.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

    try:
        text = gemini_data["candidates"][0]["content"]["parts"][0]["text"].strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        horoscope = json.loads(text.strip())
    except (KeyError, IndexError, json.JSONDecodeError):
        raise HTTPException(status_code=502, detail="Unexpected AI response format")

    # Validate required keys and fill defaults
    defaults = {
        "tong_quan": "",
        "nen_lam": [],
        "nen_tranh": [],
        "gio_tot": [],
        "mau_may_man": "",
        "con_so_may_man": "",
        "loi_khuyen": "",
    }
    for k, v in defaults.items():
        horoscope.setdefault(k, v)

    # Cache until midnight UTC
    to_cache = {k: horoscope[k] for k in defaults} | {"personalized": personalized}
    await redis.setex(cache_key, _seconds_until_midnight_utc(), json.dumps(to_cache, ensure_ascii=False))

    return HoroscopeResponse(**horoscope, date=today, cached=False, personalized=personalized, streak=streak)
