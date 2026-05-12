"""
Notifications router (Req 16, 18).

Endpoints:
- GET  /luu-sao           — lấy vị trí Lưu_Sao hôm nay của user hiện tại
- POST /luu-sao/refresh   — tính lại thủ công Lưu_Sao cho user hiện tại
- POST /daily-recalculate — chuyen_gia/nghien_cuu: batch recalculation (thường do Celery cron gọi)
- POST /test-send         — gửi test notification qua channel ưa thích của user
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("/luu-sao")
async def get_luu_sao(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trả về vị trí Lưu_Sao hôm nay của user đang đăng nhập.
    Nếu chưa có log hôm nay thì tự tính và lưu lại.
    """
    result = await NotificationService.recalculate_luu_sao(db, current_user.user_id)
    return result


@router.post("/luu-sao/refresh")
async def refresh_luu_sao(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Force-recalculate Lưu_Sao positions cho hôm nay và lưu vào DB.
    Dùng khi user muốn sync thủ công sau nửa đêm.
    """
    result = await NotificationService.recalculate_luu_sao(db, current_user.user_id)
    return {"message": "Lưu_Sao recalculated successfully", **result}


@router.post("/daily-recalculate")
async def daily_recalculate_all(
    current_user: User = Depends(require_role("chuyen_gia", "nghien_cuu")),
    db: AsyncSession = Depends(get_db),
):
    """
    Batch Lưu_Sao recalculation cho tất cả active users (Req 16).
    Thường do daily Celery cron job gọi; endpoint này cho phép trigger thủ công.
    """
    count = await NotificationService.daily_recalculate_all(db)
    return {"message": f"Recalculated Lưu_Sao for {count} users", "users_processed": count}


@router.post("/test-send")
async def test_send_notification(
    subject: str = Query(default="Test notification"),
    body: str = Query(default="This is a test notification from Tử Vi."),
    current_user: User = Depends(get_current_user),
):
    """
    Gửi test notification tới user hiện tại qua channel ưa thích (email/push/both).
    Dùng để verify cấu hình email/push.
    """
    await NotificationService.send(current_user, subject, body)
    channel = getattr(current_user, "notify_channel", "email")
    return {"message": f"Test notification dispatched via '{channel}'"}
