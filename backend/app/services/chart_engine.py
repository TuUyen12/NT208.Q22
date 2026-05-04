"""
Động_Cơ_Tử_Vi — Chart calculation via iztro (https://iztro.com).

Delegates all 108-star placement to the iztro Node.js service.
The iztro service runs as a sidecar (see docker-compose.yml) and exposes
a simple HTTP API. This module is the Python client for that service.

Output format: Ma_Trận_Lá_Số = {"1": [star, ...], ..., "12": [...]}
  - House number (str key) corresponds to palace.index + 1 from iztro
    (1 = Dần palace, 2 = Mão palace, ..., 12 = Sửu palace)
  - Star names are in zh-CN as returned by iztro (iztro has no vi-VN locale)
  - "★ Cung Mệnh" marker is appended to the 命宫 palace
  - "★ Cung Thân" marker is appended to the body palace (isBodyPalace=true)
"""

from __future__ import annotations

import httpx
from fastapi import HTTPException

from app.config import get_settings
from app.services.calendar_service import CalendarService

settings = get_settings()


def _birth_hour_to_time_index(birth_hour: str) -> int:
    """
    Convert HH:MM birth hour to iztro time index (0–11).

    iztro index mapping (12 earthly branches):
      0=Tý (23–01), 1=Sửu (01–03), 2=Dần (03–05), 3=Mão (05–07),
      4=Thìn (07–09), 5=Tỵ (09–11), 6=Ngọ (11–13), 7=Mùi (13–15),
      8=Thân (15–17), 9=Dậu (17–19), 10=Tuất (19–21), 11=Hợi (21–23)
    """
    h, _ = map(int, birth_hour.split(":"))
    if h == 23 or h == 0:
        return 0  # Tý
    return (h + 1) // 2


def _iztro_to_matrix(astrolabe: dict) -> dict[str, list[str]]:
    """
    Flatten iztro astrolabe → Ma_Trận_Lá_Số.

    Each palace's majorStars, minorStars, and adjectiveStars are merged into
    a single list of name strings. Special markers are appended:
      - "★ Cung Mệnh" on the 命宫 (Destiny) palace
      - "★ Cung Thân" on the Body palace (isBodyPalace=True)
    """
    matrix: dict[str, list[str]] = {}

    for palace in astrolabe.get("palaces", []):
        stars: list[str] = []

        for category in ("majorStars", "minorStars", "adjectiveStars"):
            for s in palace.get(category, []):
                if name := s.get("name"):
                    stars.append(name)

        if palace.get("name") == "命宫":
            stars.append("★ Cung Mệnh")
        if palace.get("isBodyPalace"):
            stars.append("★ Cung Thân")

        house_num = str(palace["index"] + 1)
        matrix[house_num] = stars

    # Req 5: every house must have ≥1 star
    for house, stars in matrix.items():
        if not stars:
            raise ValueError(f"House {house} has no stars — iztro calculation error")

    return matrix


class ChartEngine:

    @staticmethod
    def solar_to_lunar(solar_date, timezone_offset: float = 7.0) -> dict:
        return CalendarService.solar_to_lunar(solar_date, timezone_offset)

    @staticmethod
    async def calculate(solar_date, birth_hour: str, gender: str) -> dict[str, list[str]]:
        """
        Generate Ma_Trận_Lá_Số by calling the iztro microservice.

        Args:
            solar_date: datetime.date — Gregorian birth date
            birth_hour: "HH:MM" 24-hour format
            gender: "male" | "female"

        Returns:
            {"1": [star_names], ..., "12": [...]}
        """
        time_index = _birth_hour_to_time_index(birth_hour)
        date_str = f"{solar_date.year}-{solar_date.month}-{solar_date.day}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{settings.IZTRO_SERVICE_URL}/chart/solar",
                    json={"date": date_str, "timeIndex": time_index, "gender": gender},
                )
                resp.raise_for_status()
                astrolabe = resp.json()
        except httpx.HTTPStatusError as e:
            detail = e.response.json().get("error", str(e))
            raise HTTPException(status_code=422, detail=f"iztro error: {detail}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"iztro service unavailable: {e}")

        return _iztro_to_matrix(astrolabe)

    @staticmethod
    def compare(matrix_a: dict, matrix_b: dict, view: str = "side_by_side") -> dict:
        """Chart comparison with compatibility scoring (Req 9)."""
        if view == "merged":
            merged = {}
            all_keys = set(matrix_a) | set(matrix_b)
            for k in sorted(all_keys):
                merged[k] = {
                    "chart_a": matrix_a.get(k, []),
                    "chart_b": matrix_b.get(k, []),
                    "shared": list(set(matrix_a.get(k, [])) & set(matrix_b.get(k, []))),
                }
            score = _compatibility_score(matrix_a, matrix_b)
            return {"view": "merged", "houses": merged, "compatibility_score": score}
        else:
            return {
                "view": "side_by_side",
                "chart_a": matrix_a,
                "chart_b": matrix_b,
                "compatibility_score": _compatibility_score(matrix_a, matrix_b),
            }


def _compatibility_score(a: dict, b: dict) -> float:
    all_stars_a = {s for stars in a.values() for s in stars}
    all_stars_b = {s for stars in b.values() for s in stars}
    shared = len(all_stars_a & all_stars_b)
    total = len(all_stars_a | all_stars_b)
    return round(shared / total, 3) if total else 0.0
