import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel


class JournalLogCreate(BaseModel):
    log_date: date
    content: str | None = None


class JournalLogUpdate(BaseModel):
    content: str | None = None


class JournalLogResponse(BaseModel):
    log_id: uuid.UUID
    user_id: uuid.UUID
    log_date: date
    content: str | None
    luu_sao_positions: dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}
