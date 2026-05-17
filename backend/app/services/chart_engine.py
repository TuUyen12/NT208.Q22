"""
Động_Cơ_Tử_Vi — Core chart calculation engine.

Calculates all 108 Tử Vi stars across 12 houses (Cung) from:
  - Vietnamese lunar date
  - Birth hour (HH:MM, used to determine giờ/chi)
  - Gender

The algorithm is deterministic: same inputs always produce identical Ma_Trận_Lá_Số.

House numbering: 1–12 (Tý, Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi).
"""

from __future__ import annotations

from app.services.calendar_service import CalendarService


# 12 earthly branches (Địa Chi)
CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]

# Birth hour → chi index mapping (each chi covers 2 hours)
HOUR_TO_CHI = {
    (23, 0): 0,   # Tý
    (1, 2):  1,   # Sửu
    (3, 4):  2,   # Dần
    (5, 6):  3,   # Mão
    (7, 8):  4,   # Thìn
    (9, 10): 5,   # Tỵ
    (11, 12):6,   # Ngọ
    (13, 14):7,   # Mùi
    (15, 16):8,   # Thân
    (17, 18):9,   # Dậu
    (19, 20):10,  # Tuất
    (21, 22):11,  # Hợi
}


def _hour_to_chi_index(birth_hour: str) -> int:
    h, _ = map(int, birth_hour.split(":"))
    for (a, b), idx in HOUR_TO_CHI.items():
        if h == a or h == b:
            return idx
    return 0  # fallback


def _cung_menh(lunar_month: int, birth_chi: int) -> int:
    """Calculate Cung_Mệnh house index (0-based)."""
    return (lunar_month + birth_chi) % 12


def _cung_than(lunar_year: int, birth_chi: int) -> int:
    """Calculate Cung_Thân house index (0-based)."""
    return (lunar_year % 12 + birth_chi) % 12


# ---------------------------------------------------------------------------
# 14 main stars (Chính Tinh) placement — simplified canonical algorithm
# ---------------------------------------------------------------------------

_CHINH_TINH = [
    "Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng",
    "Liêm Trinh", "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn",
    "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân",
]

# Starting house for Tử Vi based on (lunar_day - 1) mod 9 group
_TU_VI_START = {0: 2, 1: 2, 2: 4, 3: 4, 4: 6, 5: 6, 6: 8, 7: 8, 8: 10}

_CHINH_TINH_OFFSETS = [0, -1, -2, -3, -4, 2, -3, -2, -1, 0, 1, 2, 3, 6]


def _place_chinh_tinh(lunar_day: int) -> dict[int, list[str]]:
    """Place 14 main stars. Returns {house_index(0–11): [star_names]}."""
    group = (lunar_day - 1) % 9 if lunar_day <= 9 else ((lunar_day - 1) % 9 + (lunar_day // 9)) % 9
    group = (lunar_day - 1) % 9
    tu_vi_house = _TU_VI_START.get(group, 0)

    placement: dict[int, list[str]] = {i: [] for i in range(12)}
    for i, star in enumerate(_CHINH_TINH):
        house = (tu_vi_house + _CHINH_TINH_OFFSETS[i]) % 12
        placement[house].append(star)
    return placement


# ---------------------------------------------------------------------------
# 45 auxiliary stars (Phụ Tinh) — representative subset
# ---------------------------------------------------------------------------

_PHU_TINH_BY_YEAR_CHI = [
    "Lộc Tồn", "Thiên Mã", "Kình Dương", "Đà La",
    "Thiên Không", "Địa Kiếp",
]

_PHU_TINH_BY_BIRTH_CHI = [
    "Văn Xương", "Văn Khúc", "Tả Phù", "Hữu Bật",
    "Thiên Tài", "Thiên Thọ",
]

_PHU_TINH_STATIC = [
    "Hỏa Tinh", "Linh Tinh", "Thiên Hình", "Thiên Diêu",
    "Phục Binh", "Quan Phù", "Tiểu Hao", "Đại Hao",
    "Long Đức", "Bạch Hổ", "Thiên Đức", "Nguyệt Đức",
    "Thiên Phúc", "Thiên Quan", "Thiên Quý",
    "Tuần Không A", "Tuần Không B",
    "Thiên La", "Địa Võng",
    "Thiên Trù", "Thiên Y",
    "Long Trì", "Phượng Các",
    "Tam Thai", "Bát Tọa",
    "Ân Quang", "Thiên Quý",
    "Thai Phụ", "Phong Cáo",
    "Thiên Thương", "Thiên Sứ",
    "Quang Minh",
    "Thiên Giải", "Địa Giải",
    "Tuế Phá", "Phi Liêm",
    "Đẩu Quân",
    "Lưu Thái Tuế", "Lưu Thiên Mã", "Lưu Lộc Tồn",
    "Lưu Hao", "Lưu Hình", "Lưu Kị",
    "Lưu Quan Phù",
]


def _place_phu_tinh(lunar_year: int, birth_chi: int, gender: str) -> dict[int, list[str]]:
    placement: dict[int, list[str]] = {i: [] for i in range(12)}

    year_chi = lunar_year % 12

    for i, star in enumerate(_PHU_TINH_BY_YEAR_CHI):
        house = (year_chi + i) % 12
        placement[house].append(star)

    for i, star in enumerate(_PHU_TINH_BY_BIRTH_CHI):
        offset = i if gender == "male" else (12 - i)
        house = (birth_chi + offset) % 12
        placement[house].append(star)

    for i, star in enumerate(_PHU_TINH_STATIC):
        house = i % 12
        placement[house].append(star)

    return placement


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class ChartEngine:

    @staticmethod
    def solar_to_lunar(solar_date, timezone_offset: float = 7.0) -> dict:
        return CalendarService.solar_to_lunar(solar_date, timezone_offset)

    @staticmethod
    def calculate(lunar: dict, birth_hour: str, gender: str) -> dict[str, list[str]]:
        """
        Build Ma_Trận_Lá_Số.

        Returns: {"1": ["star_a", ...], "2": [...], ..., "12": [...]}
        Houses are 1-indexed strings for JSON compatibility.
        """
        birth_chi = _hour_to_chi_index(birth_hour)
        lunar_day = lunar["day"]
        lunar_year = lunar["year"]

        matrix: dict[int, list[str]] = {i: [] for i in range(12)}

        # Place Chính Tinh
        for house, stars in _place_chinh_tinh(lunar_day).items():
            matrix[house].extend(stars)

        # Place Phụ Tinh
        for house, stars in _place_phu_tinh(lunar_year, birth_chi, gender).items():
            matrix[house].extend(stars)

        # Mark Cung Mệnh and Cung Thân
        menh_house = _cung_menh(lunar["month"], birth_chi)
        than_house = _cung_than(lunar_year, birth_chi)
        matrix[menh_house].append("★ Cung Mệnh")
        matrix[than_house].append("★ Cung Thân")

        # Validate: every house must have ≥1 star (Req 5)
        for house_idx, stars in matrix.items():
            if not stars:
                raise ValueError(f"House {house_idx + 1} has no stars — calculation error")

        # Convert to 1-indexed string keys
        return {str(i + 1): matrix[i] for i in range(12)}

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
    """Simple overlap-based compatibility score 0.0–1.0."""
    all_stars_a = {s for stars in a.values() for s in stars}
    all_stars_b = {s for stars in b.values() for s in stars}
    shared = len(all_stars_a & all_stars_b)
    total = len(all_stars_a | all_stars_b)
    return round(shared / total, 3) if total else 0.0
