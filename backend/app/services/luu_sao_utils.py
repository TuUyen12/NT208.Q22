"""Lưu Sao calculations — shared by daily_horoscope, journal, and notification_service."""

from __future__ import annotations

from datetime import date
from typing import Optional

# ─── lookup tables ────────────────────────────────────────────────────────────

_CAN = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"]
_CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"]

# House index 1–12: BRANCH_ORDER 巳=1, 午=2, …, 辰=12
_CHI_TO_HOUSE: dict[str, int] = {
    "Tỵ": 1, "Ngọ": 2, "Mùi": 3, "Thân": 4, "Dậu": 5, "Tuất": 6,
    "Hợi": 7, "Tý": 8, "Sửu": 9, "Dần": 10, "Mão": 11, "Thìn": 12,
}

# Lộc Tồn position by Thiên Can
_LOC_BY_CAN: dict[str, str] = {
    "Giáp": "Dần", "Ất": "Mão", "Bính": "Tỵ",  "Đinh": "Ngọ",
    "Mậu":  "Tỵ",  "Kỷ": "Ngọ", "Canh": "Thân", "Tân":  "Dậu",
    "Nhâm": "Hợi", "Quý": "Tý",
}

# Thiên Mã by Địa Chi
_THIEN_MA_BY_CHI: dict[str, str] = {
    "Thân": "Dần", "Tý": "Dần",  "Thìn": "Dần",
    "Dần":  "Thân","Ngọ": "Thân","Tuất": "Thân",
    "Tỵ":   "Hợi", "Dậu": "Hợi", "Sửu":  "Hợi",
    "Hợi":  "Tỵ",  "Mão": "Tỵ",  "Mùi":  "Tỵ",
}

# Tứ Hóa: (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ) by Thiên Can
_TU_HOA_BY_CAN: dict[str, tuple[str, str, str, str]] = {
    "Giáp": ("Liêm Trinh", "Phá Quân",   "Vũ Khúc",   "Thái Dương"),
    "Ất":   ("Thiên Cơ",   "Thiên Lương", "Tử Vi",     "Thái Âm"),
    "Bính": ("Thiên Đồng", "Thiên Cơ",   "Văn Xương",  "Liêm Trinh"),
    "Đinh": ("Thái Âm",   "Thiên Đồng",  "Thiên Cơ",   "Cự Môn"),
    "Mậu":  ("Tham Lang",  "Thái Âm",    "Hữu Bật",    "Thiên Cơ"),
    "Kỷ":   ("Vũ Khúc",   "Tham Lang",   "Thiên Lương", "Văn Khúc"),
    "Canh": ("Thái Dương", "Vũ Khúc",    "Thái Âm",    "Thiên Đồng"),
    "Tân":  ("Cự Môn",    "Thái Dương",  "Văn Khúc",   "Văn Xương"),
    "Nhâm": ("Thiên Lương","Tử Vi",      "Tả Phụ",     "Vũ Khúc"),
    "Quý":  ("Phá Quân",  "Cự Môn",      "Thái Âm",    "Tham Lang"),
}

# 2026 Bính Ngọ: solar dates when each lunar month begins (Vietnam UTC+7)
_2026_MONTH_STARTS = [
    date(2026,  2, 17),  # âm tháng 1
    date(2026,  3, 18),  # âm tháng 2
    date(2026,  4, 17),  # âm tháng 3
    date(2026,  5, 17),  # âm tháng 4
    date(2026,  6, 15),  # âm tháng 5
    date(2026,  7, 15),  # âm tháng 6
    date(2026,  8, 13),  # âm tháng 7
    date(2026,  9, 12),  # âm tháng 8
    date(2026, 10, 11),  # âm tháng 9
    date(2026, 11, 10),  # âm tháng 10
    date(2026, 12,  9),  # âm tháng 11
    date(2027,  1,  7),  # âm tháng 12
]

# ─── low-level helpers ────────────────────────────────────────────────────────

def _jdn(y: int, m: int, d: int) -> int:
    a = (14 - m) // 12
    yy = y + 4800 - a
    mm = m + 12 * a - 3
    return d + (153 * mm + 2) // 5 + 365 * yy + yy // 4 - yy // 100 + yy // 400 - 32045


def _can_chi_of_date(d: date) -> tuple:
    pos = (_jdn(d.year, d.month, d.day) + 49) % 60
    return _CAN[pos % 10], _CHI[pos % 12]


def _chi_shift(chi: str, n: int) -> str:
    return _CHI[(_CHI.index(chi) + n) % 12]


def _year_can_chi(year: int) -> tuple:
    can = _CAN[(year % 10 + 6) % 10]
    chi = _CHI[(year % 12 + 8) % 12]
    return can, chi


def _month_can_chi(year: int, lunar_month: int) -> tuple:
    year_can_idx = (year % 10 + 6) % 10
    month_can_start = (year_can_idx * 2 + 2) % 10
    can = _CAN[(month_can_start + lunar_month - 1) % 10]
    chi = _CHI[(2 + lunar_month - 1) % 12]  # month 1 = Dần (index 2)
    return can, chi


def _get_lunar_month_2026(d: date) -> Optional[int]:
    """Return lunar month (1–12) for a date in the Bính Ngọ year. None if out of range."""
    lunar_month = None
    for i, start in enumerate(_2026_MONTH_STARTS):
        if d >= start:
            lunar_month = i + 1
    return lunar_month


# ─── public API ───────────────────────────────────────────────────────────────

def _build_star_block(prefix: str, can: str, chi: str) -> dict:
    loc  = _LOC_BY_CAN[can]
    kinh = _chi_shift(loc, +1)
    da   = _chi_shift(loc, -1)
    ma   = _THIEN_MA_BY_CHI[chi]
    tang = _chi_shift(chi, +2)
    bach = _chi_shift(chi, +6)
    tu_hoa = _TU_HOA_BY_CAN[can]
    return {
        "can": can, "chi": chi,
        f"{prefix} Lộc Tồn":    {"chi": loc,  "house": _CHI_TO_HOUSE[loc]},
        f"{prefix} Kình Dương":  {"chi": kinh, "house": _CHI_TO_HOUSE[kinh]},
        f"{prefix} Đà La":       {"chi": da,   "house": _CHI_TO_HOUSE[da]},
        f"{prefix} Thiên Mã":    {"chi": ma,   "house": _CHI_TO_HOUSE[ma]},
        f"{prefix} Thái Tuế":    {"chi": chi,  "house": _CHI_TO_HOUSE[chi]},
        f"{prefix} Tang Môn":    {"chi": tang, "house": _CHI_TO_HOUSE[tang]},
        f"{prefix} Bạch Hổ":     {"chi": bach, "house": _CHI_TO_HOUSE[bach]},
        "tu_hoa": {
            tu_hoa[0]: "Hóa Lộc",
            tu_hoa[1]: "Hóa Quyền",
            tu_hoa[2]: "Hóa Khoa",
            tu_hoa[3]: "Hóa Kỵ",
        },
    }


def calculate_luu_nhat(d: date) -> dict:
    """Daily (Lưu Nhật) stars for any date."""
    can, chi = _can_chi_of_date(d)
    return _build_star_block("Lưu Nhật", can, chi)


def calculate_luu_nien(year: int) -> dict:
    """Yearly (Lưu Niên) stars — correct for any year."""
    can, chi = _year_can_chi(year)
    block = _build_star_block("Lưu Niên", can, chi)
    block["year"] = year
    return block


def calculate_luu_nguyet(d: date) -> dict:
    """Monthly (Lưu Nguyệt) stars. Only fully computed for 2026; other years return placeholder."""
    if d.year != 2026:
        return {
            "placeholder": True,
            "message": (
                f"Sao Lưu Nguyệt năm {d.year} chưa được tính. "
                "Tính năng xem vận hạn theo tháng đang được phát triển "
                "và sẽ có trong phiên bản sắp tới."
            ),
        }
    lm = _get_lunar_month_2026(d)
    if lm is None:
        return {
            "placeholder": True,
            "message": "Ngày này nằm trước Tết Bính Ngọ (tháng 1 âm lịch 2026).",
        }
    can, chi = _month_can_chi(2026, lm)
    block = _build_star_block("Lưu Nguyệt", can, chi)
    block["year"] = 2026
    block["lunar_month"] = lm
    return block


def calculate_all_tiers(d: date) -> dict:
    """Return all three tiers for a given date."""
    return {
        "luu_nhat":   calculate_luu_nhat(d),
        "luu_nguyet": calculate_luu_nguyet(d),
        "luu_nien":   calculate_luu_nien(d.year),
    }
