import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_role
from app.models.appointment import Appointment
from app.models.client import Client
from app.models.user import User
from app.schemas.appointment import AppointmentCreateRequest, AppointmentResponse, AppointmentUpdateRequest
from app.services.notification_service import NotificationService

router = APIRouter()

_expert = require_role("chuyen_gia")


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    body: AppointmentCreateRequest,
    current_user: User = Depends(_expert),
    db: AsyncSession = Depends(get_db),
):
    # Verify client belongs to this expert
    result = await db.execute(select(Client).where(Client.client_id == body.client_id))
    client = result.scalar_one_or_none()
    if not client or client.expert_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    meeting_link = NotificationService.generate_meeting_link()
    appt = Appointment(
        client_id=body.client_id,
        expert_id=current_user.user_id,
        scheduled_at=body.scheduled_at,
        notes=body.notes,
        meeting_link=meeting_link,
    )
    db.add(appt)
    await db.commit()
    await db.refresh(appt)

    # Schedule 15-min reminder (Req 18)
    await NotificationService.schedule_reminder(appt)

    return appt


@router.patch("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: uuid.UUID,
    body: AppointmentUpdateRequest,
    current_user: User = Depends(_expert),
    db: AsyncSession = Depends(get_db),
):
    appt = await _get_owned_appointment(db, appointment_id, current_user.user_id)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(appt, field, value)
    await db.commit()
    await db.refresh(appt)
    return appt


@router.get("/", response_model=list[AppointmentResponse])
async def list_appointments(
    current_user: User = Depends(_expert),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment)
        .where(Appointment.expert_id == current_user.user_id)
        .order_by(Appointment.scheduled_at)
    )
    return result.scalars().all()


async def _get_owned_appointment(db: AsyncSession, appt_id: uuid.UUID, expert_id: uuid.UUID) -> Appointment:
    result = await db.execute(select(Appointment).where(Appointment.appointment_id == appt_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt.expert_id != expert_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return appt
