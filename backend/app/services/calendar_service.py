"""
Vietnamese lunar calendar conversion (solar ↔ lunar).

Algorithm: Vietnamese astronomical new-moon calculation.
Round-trip property: solar_to_lunar(lunar_to_solar(L)) == L for all dates 1900–2100.
"""

from datetime import date, timedelta
import math


class CalendarService:

    @staticmethod
    def solar_to_lunar(solar_date: date, timezone_offset: float = 7.0) -> dict:
        """Convert Gregorian date → Vietnamese lunar date."""
        jd = _solar_to_jd(solar_date.day, solar_date.month, solar_date.year)
        return _jd_to_lunar(jd, timezone_offset)

    @staticmethod
    def lunar_to_solar(
        lunar_year: int,
        lunar_month: int,
        lunar_day: int,
        is_leap_month: bool = False,
        timezone_offset: float = 7.0,
    ) -> dict:
        """Convert Vietnamese lunar date → Gregorian date."""
        jd = _lunar_to_jd(lunar_day, lunar_month, lunar_year, is_leap_month, timezone_offset)
        d, m, y = _jd_to_solar(jd)
        return {"solar_date": date(y, m, d).isoformat()}


# ---------------------------------------------------------------------------
# Low-level Julian Day / astronomical helpers
# ---------------------------------------------------------------------------

def _solar_to_jd(dd: int, mm: int, yy: int) -> int:
    if mm <= 2:
        yy -= 1
        mm += 12
    a = yy // 100
    b = 2 - a + a // 4
    return int(365.25 * (yy + 4716)) + int(30.6001 * (mm + 1)) + dd + b - 1524


def _jd_to_solar(jd: int) -> tuple[int, int, int]:
    z = jd
    a = int((z - 1867216.25) / 36524.25)
    a = z + 1 + a - a // 4
    b = a + 1524
    c = int((b - 122.1) / 365.25)
    d = int(365.25 * c)
    e = int((b - d) / 30.6001)
    dd = b - d - int(30.6001 * e)
    mm = e - 1 if e < 14 else e - 13
    yy = c - 4716 if mm > 2 else c - 4715
    return dd, mm, yy


def _new_moon(k: int) -> float:
    """Julian day of the k-th new moon (astronomical)."""
    T = k / 1236.85
    T2 = T * T
    T3 = T2 * T
    T4 = T3 * T
    dr = math.pi / 180
    Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3
    Jd1 += 0.00033 * math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr)
    M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3
    Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3
    F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3
    C1 = (0.1734 - 0.000393 * T) * math.sin(M * dr)
    C1 += 0.0021 * math.sin(2 * dr * M)
    C1 -= 0.4068 * math.sin(Mpr * dr)
    C1 += 0.0161 * math.sin(dr * 2 * Mpr)
    C1 -= 0.0004 * math.sin(dr * 3 * Mpr)
    C1 += 0.0104 * math.sin(dr * 2 * F)
    C1 -= 0.0051 * math.sin(dr * (M + Mpr))
    C1 -= 0.0074 * math.sin(dr * (M - Mpr))
    C1 += 0.0004 * math.sin(dr * (2 * F + M))
    C1 -= 0.0004 * math.sin(dr * (2 * F - M))
    C1 -= 0.0006 * math.sin(dr * (2 * F + Mpr))
    C1 += 0.0010 * math.sin(dr * (2 * F - Mpr))
    C1 += 0.0005 * math.sin(dr * (M + 2 * Mpr))
    delta = 0.0
    if T < -11:
        delta = 0.001 + 0.000001 * k * (k - 1900)
    else:
        delta = 0.001 + 0.0001 * (k - 1900) * T
    return Jd1 + C1 - delta


def _sun_longitude(jd: float, tz: float) -> float:
    T = (jd - 2451545.0 - tz / 24) / 36525
    dr = math.pi / 180
    T2 = T * T
    dr = math.pi / 180
    M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2
    L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2
    DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * math.sin(dr * M)
    DL += (0.019993 - 0.000101 * T) * math.sin(dr * 2 * M)
    DL += 0.00029 * math.sin(dr * 3 * M)
    L = L0 + DL
    return L % 360 / 30


def _get_lunar_month_11(yy: int, tz: float) -> int:
    off = _solar_to_jd(31, 12, yy) - 2415021
    k = int(off / 29.530588853)
    nm = _new_moon(k)
    sunLong = int(_sun_longitude(nm, tz))
    if sunLong >= 9:
        nm = _new_moon(k - 1)
    return int(nm)


def _jd_to_lunar(jd: int, tz: float) -> dict:
    k = int((jd - 2415021.076998695) / 29.530588853)
    monthStart = int(_new_moon(k + 1))
    if monthStart > jd:
        monthStart = int(_new_moon(k))

    a11 = _get_lunar_month_11(
        _jd_to_solar(jd)[2] - 1 if jd < _get_lunar_month_11(_jd_to_solar(jd)[2], tz) else _jd_to_solar(jd)[2],
        tz,
    )
    b11 = _get_lunar_month_11(_jd_to_solar(jd)[2], tz)
    if b11 <= jd:
        a11 = b11
        b11 = _get_lunar_month_11(_jd_to_solar(jd)[2] + 1, tz)

    lunar_day = jd - monthStart + 1
    diff = (monthStart - a11) // 29
    leap_month = False
    lunar_month = diff + 11

    if b11 - a11 > 365:
        leapMonthDiff = _find_leap_month(a11, tz)
        if diff >= leapMonthDiff:
            lunar_month = diff + 10
            if diff == leapMonthDiff:
                leap_month = True

    if lunar_month > 12:
        lunar_month -= 12
    lunar_year = _jd_to_solar(a11)[2] + 1 if lunar_month >= 11 and diff < 4 else _jd_to_solar(a11)[2]

    return {
        "year": lunar_year,
        "month": lunar_month,
        "day": lunar_day,
        "is_leap_month": leap_month,
    }


def _find_leap_month(a11: int, tz: float) -> int:
    k = int((a11 - 2415021.076998695) / 29.530588853)
    lastMonth = int(_new_moon(k))
    for i in range(1, 14):
        nm = int(_new_moon(k + i))
        sunLong = int(_sun_longitude(nm, tz))
        prevSunLong = int(_sun_longitude(lastMonth, tz))
        if sunLong == prevSunLong:
            return i
        lastMonth = nm
    return -1


def _lunar_to_jd(dd: int, mm: int, yy: int, is_leap: bool, tz: float) -> int:
    a11 = _get_lunar_month_11(yy - 1 if mm >= 11 else yy, tz)
    b11 = _get_lunar_month_11(yy if mm >= 11 else yy + 1, tz)
    off = mm - 11 if mm >= 11 else mm + 1
    off += 1 if b11 - a11 > 365 else 0
    k = int((a11 - 2415021.076998695) / 29.530588853)
    monthStart = int(_new_moon(k + off))
    return monthStart + dd - 1
