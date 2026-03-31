import uuid
from datetime import datetime

from pydantic import BaseModel


class AppointmentCreateRequest(BaseModel):
    client_id: uuid.UUID
    scheduled_at: datetime
    notes: str | None = None


class AppointmentUpdateRequest(BaseModel):
    scheduled_at: datetime | None = None
    status: str | None = None         # "pending" | "confirmed" | "cancelled"
    payment_status: str | None = None
    notes: str | None = None


class AppointmentResponse(BaseModel):
    appointment_id: uuid.UUID
    client_id: uuid.UUID
    expert_id: uuid.UUID
    scheduled_at: datetime
    status: str
    payment_status: str
    meeting_link: str | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
