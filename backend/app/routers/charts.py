import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.chart import Chart
from app.models.user import User
from app.schemas.chart import ChartCreateRequest, ChartResponse
from app.services.chart_engine import ChartEngine
from app.core.encryption import decrypt_field, encrypt_field

router = APIRouter()


# --- /latest phải đặt trước /{chart_id} ---

@router.get("/latest", response_model=ChartResponse)
async def get_latest_chart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Chart)
        .where(Chart.user_id == current_user.user_id)
        .order_by(Chart.created_at.desc())
        .limit(1)
    )
    chart = result.scalar_one_or_none()
    if not chart:
        raise HTTPException(status_code=404, detail="No chart found")
    return _build_chart_response(chart)


# --- CRUD cơ bản ---

@router.post("/", response_model=ChartResponse, status_code=status.HTTP_201_CREATED)
async def create_chart(
    body: ChartCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Store a Lá_Số generated client-side by iztro (Req 4, 5)."""
    birth_hour = body.birth_hour or "12:00"
    warned = body.birth_hour is None  # Req 2: notify if defaulted

    lunar = ChartEngine.solar_to_lunar(body.dob_solar, body.timezone_offset)

    chart = Chart(
        user_id=current_user.user_id,
        name=body.name,
        gender=body.gender,
        dob_solar_enc=encrypt_field(str(body.dob_solar)),
        birth_hour_enc=encrypt_field(birth_hour),
        dob_lunar_year=lunar["year"],
        dob_lunar_month=lunar["month"],
        dob_lunar_day=lunar["day"],
        dob_lunar_leap=lunar["is_leap_month"],
        chart_matrix=body.chart_matrix,
    )
    db.add(chart)
    await db.commit()
    await db.refresh(chart)

    response = _build_chart_response(chart)
    if warned:
        response["birth_hour_defaulted"] = True
    return response


@router.get("/", response_model=list[ChartResponse])
async def list_charts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Chart)
        .where(Chart.user_id == current_user.user_id)
        .order_by(Chart.created_at.desc())
    )
    charts = result.scalars().all()
    return [_build_chart_response(c) for c in charts]


# ⚠️ Route động /{chart_id} phải ở CUỐI CÙNG
@router.get("/{chart_id}", response_model=ChartResponse)
async def get_chart(
    chart_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chart = await _get_owned_chart(db, chart_id, current_user.user_id)
    return _build_chart_response(chart)


@router.delete("/{chart_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chart(
    chart_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chart = await _get_owned_chart(db, chart_id, current_user.user_id)
    await db.delete(chart)
    await db.commit()


# --- Helpers ---

async def _get_owned_chart(db: AsyncSession, chart_id: uuid.UUID, user_id: uuid.UUID) -> Chart:
    result = await db.execute(select(Chart).where(Chart.chart_id == chart_id))
    chart = result.scalar_one_or_none()
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    if chart.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return chart


def _build_chart_response(chart: Chart) -> dict:
    return {
        "chart_id": chart.chart_id,
        "user_id": chart.user_id,
        "name": chart.name,
        "gender": chart.gender,
        "dob_solar": decrypt_field(chart.dob_solar_enc),
        "birth_hour": decrypt_field(chart.birth_hour_enc),
        "lunar_date": {
            "year": chart.dob_lunar_year,
            "month": chart.dob_lunar_month,
            "day": chart.dob_lunar_day,
            "is_leap_month": chart.dob_lunar_leap,
        },
        "chart_matrix": chart.chart_matrix,
        "ai_interpretation": chart.ai_interpretation,
        "created_at": chart.created_at,
    }


