"""
Notification & Scheduling service (Req 16, 18).

- Lưu_Sao daily recalculation for active users
- Push/email dispatch based on notify_channel preference
- Appointment 15-minute reminder scheduling
- Meeting link generation
"""

import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings

settings = get_settings()


class NotificationService:

    @staticmethod
    def generate_meeting_link() -> str:
        token = secrets.token_urlsafe(16)
        return f"https://meet.tuvi.app/{token}"

    @staticmethod
    async def schedule_reminder(appointment) -> None:
        """
        Schedule a reminder 15 minutes before the appointment (Req 18).
        In production: enqueue a delayed task in Celery/ARQ/APScheduler.
        """
        remind_at = appointment.scheduled_at - timedelta(minutes=15)
        # TODO: enqueue task — reminder_at=remind_at, appointment_id=appointment.appointment_id
        pass

    @staticmethod
    async def recalculate_luu_sao(db: AsyncSession, user_id: uuid.UUID) -> dict:
        """
        Recalculate time-dependent moving stars (Lưu_Sao) for a user.
        Returns the updated positions dict.
        """
        from app.models.journal import JournalLog

        today = datetime.now(timezone.utc).date()

        result = await db.execute(
            select(JournalLog).where(
                JournalLog.user_id == user_id,
                JournalLog.log_date == today,
            )
        )
        log = result.scalar_one_or_none()

        luu_sao = _calculate_luu_sao(today)

        if log:
            log.luu_sao_positions = luu_sao
        else:
            log = JournalLog(
                user_id=user_id,
                log_date=today,
                luu_sao_positions=luu_sao,
            )
            db.add(log)

        await db.commit()
        return {"log_date": today.isoformat(), "luu_sao_positions": luu_sao}

    @staticmethod
    async def daily_recalculate_all(db: AsyncSession) -> int:
        """
        Batch Lưu_Sao recalculation for all active users (Req 16).
        Called by a daily cron job.
        Returns the number of users processed.
        """
        from app.models.user import User

        result = await db.execute(select(User).where(User.is_active == True))  # noqa: E712
        users = result.scalars().all()

        for user in users:
            await NotificationService.recalculate_luu_sao(db, user.user_id)

        return len(users)

    @staticmethod
    async def send(user, subject: str, body: str) -> None:
        """
        Dispatch notification via the user's preferred channel (Req 16).
        Stub — wire up real email/push providers here.
        """
        channel = getattr(user, "notify_channel", "email")
        if channel in ("email", "both"):
            await _send_email(user.email, subject, body)
        if channel in ("push", "both"):
            await _send_push(str(user.user_id), subject, body)


async def _send_email(to: str, subject: str, body: str) -> None:
    # TODO: integrate SendGrid / SES / SMTP
    pass


async def _send_push(user_id: str, title: str, body: str) -> None:
    # TODO: integrate FCM / APNs
    pass


def _calculate_luu_sao(today) -> dict:
    """
    Deterministic Lưu_Sao positions for a given date.
    Returns house assignments for Lưu Thái Tuế, Lưu Thiên Mã, Lưu Lộc Tồn.
    """
    year_chi = today.year % 12

    return {
        "Lưu Thái Tuế": year_chi + 1,                  # house 1-indexed
        "Lưu Thiên Mã": (year_chi + 3) % 12 + 1,
        "Lưu Lộc Tồn": (year_chi + 6) % 12 + 1,
        "Lưu Hao":      (year_chi + 1) % 12 + 1,
        "Lưu Hình":     (year_chi + 4) % 12 + 1,
        "Lưu Kị":       (year_chi + 9) % 12 + 1,
    }
