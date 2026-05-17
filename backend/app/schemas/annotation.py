import uuid
from datetime import datetime

from pydantic import BaseModel


class AnnotationCreateRequest(BaseModel):
    chart_id: uuid.UUID
    house_number: int | None = None
    star_name: str | None = None
    content: str


class AnnotationUpdateRequest(BaseModel):
    house_number: int | None = None
    star_name: str | None = None
    content: str | None = None


class AnnotationResponse(BaseModel):
    annotation_id: uuid.UUID
    chart_id: uuid.UUID
    house_number: int | None
    star_name: str | None
    content: str
    created_at: datetime
    modified_at: datetime

    model_config = {"from_attributes": True}
