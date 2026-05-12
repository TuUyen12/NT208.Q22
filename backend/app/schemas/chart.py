import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, field_validator


class ChartCreateRequest(BaseModel):
    name: str
    gender: str                   # "male" | "female"
    dob_solar: date
    birth_hour: str | None = None  # HH:MM; defaults to 12:00
    timezone_offset: float = 7.0   # hours from UTC; default Vietnam (UTC+7)
    configuration_id: uuid.UUID | None = None

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        if v not in ("male", "female"):
            raise ValueError("gender must be 'male' or 'female'")
        return v

    @field_validator("dob_solar")
    @classmethod
    def validate_date_range(cls, v: date) -> date:
        from datetime import date as dt
        if v < dt(1900, 1, 1) or v > dt.today():
            raise ValueError("dob_solar must be between 1900-01-01 and today")
        return v

    @field_validator("birth_hour")
    @classmethod
    def validate_birth_hour(cls, v: str | None) -> str | None:
        if v is None:
            return v
        parts = v.split(":")
        if len(parts) != 2:
            raise ValueError("birth_hour must be HH:MM")
        h, m = int(parts[0]), int(parts[1])
        if not (0 <= h <= 23 and 0 <= m <= 59):
            raise ValueError("birth_hour out of range")
        return v


class LunarDate(BaseModel):
    year: int
    month: int
    day: int
    is_leap_month: bool


class ChartResponse(BaseModel):
    chart_id: uuid.UUID
    user_id: uuid.UUID
    name: str
    gender: str
    dob_solar: date
    birth_hour: str
    lunar_date: LunarDate
    chart_matrix: dict[str, Any]   # house_number → list of star names
    configuration_id: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChartCompareRequest(BaseModel):
    chart_id_a: uuid.UUID
    chart_id_b: uuid.UUID
    view: str = "side_by_side"   # "side_by_side" | "merged"


class ChartSearchRequest(BaseModel):
    star_name: str | None = None
    house_number: int | None = None
    date_from: date | None = None
    date_to: date | None = None


class ConfigurationCreateRequest(BaseModel):
    name: str
    rules: dict[str, Any]


class ConfigurationResponse(BaseModel):
    configuration_id: uuid.UUID
    name: str
    rules: dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}
