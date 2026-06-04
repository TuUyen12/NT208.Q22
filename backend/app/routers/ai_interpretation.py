import base64
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.chart import Chart
from app.models.user import User
from app.services.ai_service import AIService
from app.services.tts_service import TTSService

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

    try:
        interpretation = await AIService.interpret(chart.chart_matrix)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=f"AI response invalid: {e}")

    chart.ai_interpretation = interpretation
    from datetime import datetime
    chart.ai_cached_at = datetime.utcnow()
    await db.commit()

    return {"interpretation": interpretation, "cached": False}


_ALLOWED_FIELDS = {"overall", "cung_menh", "cung_tai_bach", "cung_quan_loc", "cung_phu_the", "dai_han", "luu_y"}


@router.post("/{chart_id}/tts")
async def tts_section(
    chart_id: uuid.UUID,
    voice: str = Query(default="female", pattern="^(female|male)$"),
    field: str = Query(default="overall"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return base64 MP3 audio for a chosen interpretation section."""
    if field not in _ALLOWED_FIELDS:
        raise HTTPException(status_code=400, detail=f"Invalid field. Allowed: {sorted(_ALLOWED_FIELDS)}")

    result = await db.execute(select(Chart).where(Chart.chart_id == chart_id))
    chart = result.scalar_one_or_none()
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    if chart.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not chart.ai_interpretation or chart.ai_interpretation.get("_fallback"):
        raise HTTPException(status_code=400, detail="No AI interpretation available yet")

    text: str = chart.ai_interpretation.get(field, "")
    if not text:
        raise HTTPException(status_code=400, detail=f"Field '{field}' is empty")

    try:
        audio_bytes = await TTSService.synthesize(text, voice=voice)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"TTS error: {e}")

    return {
        "audio_base64": base64.b64encode(audio_bytes).decode(),
        "content_type": "audio/mpeg",
    }