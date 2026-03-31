"""
AI Interpretation service (Req 7).

Sends Ma_Trận_Lá_Số to an external AI endpoint (configurable; defaults to Claude).
Validates response is non-empty Vietnamese text with at least one Cung_Mệnh interpretation.
Graceful degradation: if AI is unavailable, returns cached result or raises a soft error.
"""

import httpx

from app.config import get_settings

settings = get_settings()

_CUNG_MENH_MARKER = "★ Cung Mệnh"

# Vietnamese character check — presence of diacritical vowels
_VI_CHARS = set("àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỷỹỵ")


def _is_vietnamese(text: str) -> bool:
    return any(c in _VI_CHARS for c in text.lower())


def _find_menh_house(matrix: dict) -> str | None:
    for house, stars in matrix.items():
        if _CUNG_MENH_MARKER in stars:
            return house
    return None


class AIService:

    @staticmethod
    async def interpret(chart_matrix: dict) -> dict:
        """
        Request interpretation from external AI.
        Returns structured dict: {"overall": str, "houses": {house: str}, "cung_menh": str}
        Falls back gracefully if service is unavailable.
        """
        menh_house = _find_menh_house(chart_matrix)

        payload = {
            "chart_matrix": chart_matrix,
            "cung_menh_house": menh_house,
            "language": "vi",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    settings.AI_SERVICE_URL,
                    json=payload,
                    headers={"Authorization": f"Bearer {settings.AI_SERVICE_API_KEY}"},
                )
                resp.raise_for_status()
                result = resp.json()
        except (httpx.HTTPError, Exception):
            # Graceful degradation — return a stub so callers can serve cache (Req 7)
            return _fallback_interpretation(chart_matrix, menh_house)

        _validate_response(result, menh_house)
        return result


def _validate_response(result: dict, menh_house: str | None) -> None:
    if not result:
        raise ValueError("AI response is empty")

    overall = result.get("overall", "")
    if not overall or not _is_vietnamese(overall):
        raise ValueError("AI response must be non-empty Vietnamese text")

    if menh_house and not result.get("cung_menh"):
        raise ValueError("AI response must include Cung_Mệnh interpretation")


def _fallback_interpretation(matrix: dict, menh_house: str | None) -> dict:
    """Minimal stub returned when AI service is unavailable."""
    return {
        "overall": "Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.",
        "houses": {},
        "cung_menh": f"Cung Mệnh tại nhà {menh_house}." if menh_house else "",
        "_fallback": True,
    }
