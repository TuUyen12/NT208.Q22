"""
Notifications router.

In-app notifications:
- GET  /              — list notifications (newest first, limit 20)
- GET  /unread-count  — number of unread
- PATCH /{id}/read   — mark one as read
- PATCH /read-all    — mark all as read

Lưu-Sao utilities:
- GET  /luu-sao           — lấy vị trí Lưu_Sao hôm nay của user hiện tại
- POST /luu-sao/refresh   — tính lại thủ công Lưu_Sao cho user hiện tại
- POST /daily-recalculate — batch recalculation (thường do Celery cron gọi)
- POST /test-send         — gửi test notification qua channel ưa thích của user
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.services.notification_service import NotificationService

router = APIRouter()


# ── In-app notifications ────────────────────────────────────────────────────

@router.get("/")
async def list_notifications(
    limit: int = Query(default=20, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    items = result.scalars().all()
    return [
        {
            "id": str(n.id),
            "title": n.title,
            "body": n.body,
            "notif_type": n.notif_type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in items
    ]


@router.get("/unread-count")
async def unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(func.count()).where(
            Notification.user_id == current_user.user_id,
            Notification.is_read == False,  # noqa: E712
        )
    )
    count = result.scalar_one()
    return {"count": count}


@router.patch("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(Notification)
        .where(
            Notification.user_id == current_user.user_id,
            Notification.is_read == False,  # noqa: E712
        )
        .values(is_read=True)
    )
    await db.commit()
    return {"ok": True}


@router.patch("/{notif_id}/read")
async def mark_one_read(
    notif_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notif_id,
            Notification.user_id == current_user.user_id,
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    return {"ok": True}


# ── Lưu-Sao utilities ───────────────────────────────────────────────────────

@router.get("/luu-sao")
async def get_luu_sao(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await NotificationService.recalculate_luu_sao(db, current_user.user_id)
    return result


@router.post("/luu-sao/refresh")
async def refresh_luu_sao(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await NotificationService.recalculate_luu_sao(db, current_user.user_id)
    return {"message": "Lưu_Sao recalculated successfully", **result}


@router.post("/daily-recalculate")
async def daily_recalculate_all(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = await NotificationService.daily_recalculate_all(db)
    return {"message": f"Recalculated Lưu_Sao for {count} users", "users_processed": count}


@router.post("/test-send")
async def test_send_notification(
    subject: str = Query(default="Test notification"),
    body: str = Query(default="This is a test notification from Tử Vi."),
    current_user: User = Depends(get_current_user),
):
    await NotificationService.send(current_user, subject, body)
    channel = getattr(current_user, "notify_channel", "email")
    return {"message": f"Test notification dispatched via '{channel}'"}


@router.post("/test-email")
async def test_daily_email(
    current_user: User = Depends(get_current_user),
):
    """Gửi thử email sao lưu hàng ngày đến chính user đang đăng nhập."""
    from datetime import datetime, timezone
    from app.services.notification_service import _build_email_html, _send_email
    from app.services.luu_sao_utils import calculate_all_tiers

    today = datetime.now(timezone.utc).date()
    luu_sao = calculate_all_tiers(today)
    date_str = today.strftime("%d/%m/%Y")

    subject = f"[TEST] YinYang — Sao lưu hôm nay {date_str}"
    html = _build_email_html(current_user.full_name or current_user.email, date_str, luu_sao)
    await _send_email(current_user.email, subject, html)

    return {"message": f"Email đã gửi đến {current_user.email}"}
