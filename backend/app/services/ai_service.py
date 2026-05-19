"""
AI Interpretation service — Gemini 1.5 Flash backend.

Sends the lá số (chart_matrix from iztro) to Gemini and returns a structured
Vietnamese interpretation cached on the Chart record.
"""

import json
import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash-lite:generateContent"
)

# Chinese → Vietnamese palace name map (iztro zh-CN output)
_PALACE_VI = {
    "命宫": "Mệnh", "兄弟": "Huynh Đệ", "夫妻": "Phu Thê",
    "子女": "Tử Tức", "财帛": "Tài Bạch", "疾厄": "Tật Ách",
    "迁移": "Thiên Di", "仆役": "Nô Bộc", "官禄": "Quan Lộc",
    "田宅": "Điền Trạch", "福德": "Phúc Đức", "父母": "Phụ Mẫu",
}


def _summarise_matrix(matrix: dict) -> str:
    """Convert raw iztro chart_matrix into a compact Vietnamese-readable summary."""
    palaces = matrix.get("palaces", [])
    lines = []
    for p in palaces:
        name_cn = p.get("name", "")
        name_vi = _PALACE_VI.get(name_cn, name_cn)
        branch = p.get("earthlyBranch", "")
        major = [s.get("name", "") for s in p.get("majorStars", [])]
        minor = [s.get("name", "") for s in (p.get("minorStars", []) + p.get("adjectiveStars", []))]
        decadal = p.get("decadal", {})
        age_range = decadal.get("range", [])
        line = f"  [{name_vi} / {branch}]"
        if major:
            line += f"  Chính tinh: {', '.join(major)}"
        if minor:
            line += f"  |  Phụ tinh: {', '.join(minor[:6])}"
        if age_range:
            line += f"  |  Đại hạn: {age_range[0]}–{age_range[1]}"
        lines.append(line)

    soul = matrix.get("soul", "")
    body = matrix.get("body", "")
    element = matrix.get("fiveElementsClass", "")
    header = f"Mệnh chủ: {soul}  |  Thân chủ: {body}  |  Cục: {element}\n"
    return header + "\n".join(lines)


def _build_prompt(matrix: dict) -> str:
    summary = _summarise_matrix(matrix)
    return f"""Bạn là chuyên gia Tử Vi Đẩu Số với nhiều năm kinh nghiệm luận giải lá số. \
Hãy phân tích lá số Tử Vi sau và trả lời HOÀN TOÀN bằng tiếng Việt.

=== LÁ SỐ ===
{summary}
=============

Trả về một JSON object hợp lệ (không thêm markdown hay text khác) theo cấu trúc:
{{
  "overall": "Luận giải tổng quát 3-4 đoạn về tính cách, vận mệnh tổng thể và những điểm nổi bật.",
  "cung_menh": "Phân tích sâu cung Mệnh: chính tinh, phụ tinh và ý nghĩa.",
  "cung_tai_bach": "Phân tích cung Tài Bạch: tài vận, cách kiếm tiền.",
  "cung_quan_loc": "Phân tích cung Quan Lộc: sự nghiệp, thăng tiến.",
  "cung_phu_the": "Phân tích cung Phu Thê: hôn nhân, tình duyên.",
  "dai_han": "Luận giải các đại hạn quan trọng trong cuộc đời.",
  "luu_y": "Những điểm cần lưu ý và lời khuyên cho chủ nhân lá số."
}}"""


class AIService:

    @staticmethod
    async def interpret(chart_matrix: dict) -> dict:
        if not settings.GEMINI_API_KEY:
            return _fallback()

        prompt = _build_prompt(chart_matrix)

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{_GEMINI_URL}?key={settings.GEMINI_API_KEY}",
                    json={
                        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.7,
                            "maxOutputTokens": 2048,
                        },
                    },
                )
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPError as e:
            logger.error("Gemini HTTP error: %s — response: %s", e, getattr(e, "response", None) and e.response.text)
            return _fallback()

        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            # Strip markdown code fences if Gemini wraps the JSON
            text = text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text.strip())
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            logger.error("Gemini parse error: %s — raw data: %s", e, data)
            return _fallback()


def _fallback() -> dict:
    return {
        "overall": "Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.",
        "cung_menh": "",
        "cung_tai_bach": "",
        "cung_quan_loc": "",
        "cung_phu_the": "",
        "dai_han": "",
        "luu_y": "",
        "_fallback": True,
    }
