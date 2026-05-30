"""
Celery application + beat schedule.

Start worker:
    celery -A app.tasks.celery_app worker --loglevel=info

Start beat scheduler (daily jobs):
    celery -A app.tasks.celery_app beat --loglevel=info
"""

from celery import Celery
from celery.schedules import crontab

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "tuvi",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.jobs"],
)

celery_app.conf.timezone = "Asia/Ho_Chi_Minh"
celery_app.conf.broker_connection_retry_on_startup = True

celery_app.conf.beat_schedule = {
    # Daily Lưu_Sao recalculation at 00:05 ICT (Req 16)
    "daily-luu-sao-recalculation": {
        "task": "app.tasks.jobs.recalculate_luu_sao_all_users",
        "schedule": crontab(hour=0, minute=5),
    },
    # Daily horoscope email at 07:00 ICT
    "daily-horoscope-email": {
        "task": "app.tasks.jobs.send_daily_horoscope_emails",
        "schedule": crontab(hour=7, minute=0),
    },
}