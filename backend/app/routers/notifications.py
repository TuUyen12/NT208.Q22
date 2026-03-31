from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("/preferences")
async def get_preferences(current_user: User = Depends(get_current_user)):
    return {"notify_channel": current_user.notify_channel}


@router.put("/preferences")
async def update_preferences(
    notify_channel: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if notify_channel not in ("email", "push", "both"):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid channel")
    current_user.notify_channel = notify_channel
    await db.commit()
    return {"notify_channel": current_user.notify_channel}


@router.post("/luu-sao/recalculate")
async def trigger_luu_sao_recalculation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger Lưu_Sao recalculation for current user (Req 16)."""
    result = await NotificationService.recalculate_luu_sao(db, current_user.user_id)
    return result
