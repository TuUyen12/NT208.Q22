from datetime import date

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.calendar_service import CalendarService

router = APIRouter()


class SolarToLunarRequest(BaseModel):
    dob_solar: date
    timezone_offset: float = 7.0


class LunarToSolarRequest(BaseModel):
    lunar_year: int
    lunar_month: int
    lunar_day: int
    is_leap_month: bool = False
    timezone_offset: float = 7.0


@router.post("/solar-to-lunar")
async def solar_to_lunar(body: SolarToLunarRequest):
    """Convert Gregorian date → Vietnamese lunar date (Req 3)."""
    result = CalendarService.solar_to_lunar(body.dob_solar, body.timezone_offset)
    return result


@router.post("/lunar-to-solar")
async def lunar_to_solar(body: LunarToSolarRequest):
    """Convert lunar date → Gregorian (round-trip verification, Req 3)."""
    result = CalendarService.lunar_to_solar(
        body.lunar_year,
        body.lunar_month,
        body.lunar_day,
        body.is_leap_month,
        body.timezone_offset,
    )
    return result
