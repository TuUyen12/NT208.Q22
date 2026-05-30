"""
Notification service (Req 16).

- Lưu_Sao daily recalculation for active users
- Push/email dispatch based on notify_channel preference
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.luu_sao_utils import calculate_all_tiers

class NotificationService:

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

        luu_sao = calculate_all_tiers(today)

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


