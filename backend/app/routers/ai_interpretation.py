import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.chart import Chart
from app.models.user import User
from app.services.ai_service import AIService

router = APIRouter()


@router.post("/{chart_id}/interpret")
async def interpret_chart(
    chart_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate or return cached AI interpretation for a chart (Req 7)."""
    result = await db.execute(select(Chart).where(Chart.chart_id == chart_id))
    chart = result.scalar_one_or_none()
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    if chart.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Serve from cache if available
    if chart.ai_interpretation:
        return {"interpretation": chart.ai_interpretation, "cached": True}

    interpretation = await AIService.interpret(chart.chart_matrix)

    chart.ai_interpretation = interpretation
    from datetime import datetime
    chart.ai_cached_at = datetime.utcnow()
    await db.commit()

    return {"interpretation": interpretation, "cached": False}
