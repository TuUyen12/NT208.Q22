"""
Journal logs (Req 16) — daily personal notes linked to Lưu_Sao positions.

Each user gets one log per date; the Lưu_Sao positions are auto-computed on creation.
"""

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.journal import JournalLog
from app.models.user import User
from app.schemas.journal import JournalLogCreate, JournalLogResponse, JournalLogUpdate
from app.services.notification_service import _calculate_luu_sao

router = APIRouter()


@router.post("/", response_model=JournalLogResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_log(
    body: JournalLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a log for a date (upsert — one log per user per day)."""
    result = await db.execute(
        select(JournalLog).where(
            JournalLog.user_id == current_user.user_id,
            JournalLog.log_date == body.log_date,
        )
    )
    log = result.scalar_one_or_none()

    luu_sao = _calculate_luu_sao(body.log_date)

    if log:
        log.content = body.content
        log.luu_sao_positions = luu_sao
    else:
        log = JournalLog(
            user_id=current_user.user_id,
            log_date=body.log_date,
            content=body.content,
            luu_sao_positions=luu_sao,
        )
        db.add(log)

    await db.commit()
    await db.refresh(log)
    return log


@router.get("/", response_model=list[JournalLogResponse])
async def list_logs(
    date_from: date | None = None,
    date_to: date | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(JournalLog).where(JournalLog.user_id == current_user.user_id)
    if date_from:
        q = q.where(JournalLog.log_date >= date_from)
    if date_to:
        q = q.where(JournalLog.log_date <= date_to)
    result = await db.execute(q.order_by(JournalLog.log_date.desc()))
    return result.scalars().all()


@router.get("/{log_date}", response_model=JournalLogResponse)
async def get_log(
    log_date: date,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    log = await _get_owned_log(db, log_date, current_user.user_id)
    return log


@router.patch("/{log_date}", response_model=JournalLogResponse)
async def update_log(
    log_date: date,
    body: JournalLogUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    log = await _get_owned_log(db, log_date, current_user.user_id)
    if body.content is not None:
        log.content = body.content
    await db.commit()
    await db.refresh(log)
    return log


@router.delete("/{log_date}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_log(
    log_date: date,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    log = await _get_owned_log(db, log_date, current_user.user_id)
    await db.delete(log)
    await db.commit()


async def _get_owned_log(db: AsyncSession, log_date: date, user_id: uuid.UUID) -> JournalLog:
    result = await db.execute(
        select(JournalLog).where(
            JournalLog.user_id == user_id,
            JournalLog.log_date == log_date,
        )
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log
