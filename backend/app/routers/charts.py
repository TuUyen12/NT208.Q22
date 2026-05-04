import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.chart import Chart, ChartConfiguration
from app.models.user import User
from app.schemas.chart import (
    ChartCompareRequest,
    ChartCreateRequest,
    ChartResponse,
    ChartSearchRequest,
    ConfigurationCreateRequest,
    ConfigurationResponse,
)
from app.services.chart_engine import ChartEngine
from app.core.encryption import decrypt_field, encrypt_field

router = APIRouter()


@router.post("/", response_model=ChartResponse, status_code=status.HTTP_201_CREATED)
async def create_chart(
    body: ChartCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Calculate and store a new Lá_Số (Req 4, 5)."""
    birth_hour = body.birth_hour or "12:00"
    warned = body.birth_hour is None  # Req 2: notify if defaulted

    lunar = ChartEngine.solar_to_lunar(body.dob_solar, body.timezone_offset)
    matrix = await ChartEngine.calculate(body.dob_solar, birth_hour, body.gender)

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
        chart_matrix=matrix,
        configuration_id=body.configuration_id,
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


# --- Researcher: chart comparison (Req 9) ---

@router.post("/compare")
async def compare_charts(
    body: ChartCompareRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chart_a = await _get_owned_chart(db, body.chart_id_a, current_user.user_id)
    chart_b = await _get_owned_chart(db, body.chart_id_b, current_user.user_id)
    return ChartEngine.compare(chart_a.chart_matrix, chart_b.chart_matrix, body.view)


# --- Researcher: advanced search (Req 11) ---

@router.post("/search", response_model=list[ChartResponse])
async def search_charts(
    body: ChartSearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import and_, cast
    from sqlalchemy.dialects.postgresql import JSONB

    filters = [Chart.user_id == current_user.user_id]

    if body.date_from:
        filters.append(Chart.created_at >= body.date_from)
    if body.date_to:
        filters.append(Chart.created_at <= body.date_to)
    # Star name / house filters applied in-memory after fetch (JSONB path query)

    result = await db.execute(select(Chart).where(and_(*filters)))
    charts = result.scalars().all()

    if body.star_name:
        charts = [c for c in charts if _chart_has_star(c.chart_matrix, body.star_name)]
    if body.house_number:
        charts = [c for c in charts if str(body.house_number) in c.chart_matrix]

    return [_build_chart_response(c) for c in charts]


# --- Researcher: named configurations (Req 8) ---

@router.post("/configurations", response_model=ConfigurationResponse, status_code=201)
async def create_configuration(
    body: ConfigurationCreateRequest,
    current_user: User = Depends(require_role("nghien_cuu", "chuyen_gia")),
    db: AsyncSession = Depends(get_db),
):
    cfg = ChartConfiguration(user_id=current_user.user_id, name=body.name, rules=body.rules)
    db.add(cfg)
    await db.commit()
    await db.refresh(cfg)
    return cfg


@router.get("/configurations", response_model=list[ConfigurationResponse])
async def list_configurations(
    current_user: User = Depends(require_role("nghien_cuu", "chuyen_gia")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChartConfiguration).where(ChartConfiguration.user_id == current_user.user_id)
    )
    return result.scalars().all()


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
        "configuration_id": chart.configuration_id,
        "created_at": chart.created_at,
    }


def _chart_has_star(matrix: dict, star_name: str) -> bool:
    for stars in matrix.values():
        if isinstance(stars, list) and star_name in stars:
            return True
    return False
