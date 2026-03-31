"""
Celery task implementations.
Each task runs in its own sync context and manages its own DB session.
"""

import asyncio
from datetime import datetime, timedelta, timezone

from app.tasks.celery_app import celery_app


# ---------------------------------------------------------------------------
# Helper: run an async function inside a Celery task (which is sync)
# ---------------------------------------------------------------------------

def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


# ---------------------------------------------------------------------------
# Task 1: Daily Lưu_Sao recalculation for all active users (Req 16)
# ---------------------------------------------------------------------------

@celery_app.task(name="app.tasks.jobs.recalculate_luu_sao_all_users", bind=True, max_retries=3)
def recalculate_luu_sao_all_users(self):
    async def _inner():
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
        from app.config import get_settings
        from app.services.notification_service import NotificationService

        settings = get_settings()
        engine = create_async_engine(settings.DATABASE_URL)
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with Session() as db:
            count = await NotificationService.daily_recalculate_all(db)
            return count

    try:
        count = _run(_inner())
        return {"recalculated": count}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * 5)   # retry after 5 min


# ---------------------------------------------------------------------------
# Task 2: Appointment reminders — 15 min before scheduled time (Req 18)
# ---------------------------------------------------------------------------

@celery_app.task(name="app.tasks.jobs.send_appointment_reminders", bind=True, max_retries=2)
def send_appointment_reminders(self):
    async def _inner():
        from sqlalchemy import select, and_
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
        from app.config import get_settings
        from app.models.appointment import Appointment
        from app.models.client import Client
        from app.models.user import User
        from app.services.notification_service import NotificationService

        settings = get_settings()
        engine = create_async_engine(settings.DATABASE_URL)
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        now = datetime.now(timezone.utc)
        window_start = now + timedelta(minutes=14)
        window_end = now + timedelta(minutes=16)

        async with Session() as db:
            result = await db.execute(
                select(Appointment).where(
                    and_(
                        Appointment.status == "confirmed",
                        Appointment.scheduled_at >= window_start,
                        Appointment.scheduled_at <= window_end,
                    )
                )
            )
            appts = result.scalars().all()

            for appt in appts:
                expert_result = await db.execute(
                    select(User).where(User.user_id == appt.expert_id)
                )
                expert = expert_result.scalar_one_or_none()
                if expert:
                    await NotificationService.send(
                        expert,
                        subject="Nhắc lịch hẹn — 15 phút nữa",
                        body=f"Bạn có lịch hẹn lúc {appt.scheduled_at.strftime('%H:%M')}. Link: {appt.meeting_link}",
                    )

            return {"reminders_sent": len(appts)}

    try:
        return _run(_inner())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)
