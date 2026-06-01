"""
Celery task implementations.
Each task runs in its own sync context and manages its own DB session.
"""

import asyncio

from app.tasks.celery_app import celery_app


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


@celery_app.task(name="app.tasks.jobs.send_daily_horoscope_emails", bind=True, max_retries=3)
def send_daily_horoscope_emails(self):
    async def _inner():
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
        from app.core.config import get_settings
        from app.services.notification_service import NotificationService

        settings = get_settings()
        engine = create_async_engine(settings.DATABASE_URL, connect_args={"ssl": False})
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with Session() as db:
            count = await NotificationService.send_daily_horoscope_emails(db)
            return count

    try:
        count = _run(_inner())
        return {"emails_sent": count}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * 5)


@celery_app.task(name="app.tasks.jobs.recalculate_luu_sao_all_users", bind=True, max_retries=3)
def recalculate_luu_sao_all_users(self):
    async def _inner():
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
        from app.core.config import get_settings
        from app.services.notification_service import NotificationService

        settings = get_settings()
        engine = create_async_engine(settings.DATABASE_URL, connect_args={"ssl": False})
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with Session() as db:
            count = await NotificationService.daily_recalculate_all(db)
            return count

    try:
        count = _run(_inner())
        return {"recalculated": count}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * 5)
