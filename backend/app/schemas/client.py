import uuid
from datetime import date, datetime

from pydantic import BaseModel, EmailStr


class ClientCreateRequest(BaseModel):
    name: str
    email: EmailStr | None = None
    phone: str | None = None
    notes: str | None = None
    tags: list[str] = []


class ClientUpdateRequest(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    notes: str | None = None
    tags: list[str] | None = None


class ClientResponse(BaseModel):
    client_id: uuid.UUID
    expert_id: uuid.UUID
    name: str
    email: str | None
    phone: str | None
    tags: list[str]
    last_consultation: date | None
    created_at: datetime

    model_config = {"from_attributes": True}


class BulkTagRequest(BaseModel):
    client_ids: list[uuid.UUID]
    tags: list[str]


class BulkExportRequest(BaseModel):
    client_ids: list[uuid.UUID]
    format: str = "csv"   # "csv" | "json"
