"""
PDF report export with expert branding (Req 15).

Flow:
  POST /reports/           → generate PDF, store to disk/object-storage, return signed URL
  GET  /reports/download/{token} → verify token, stream PDF (valid 24 h)
"""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_role
from app.models.chart import Chart
from app.models.client import Client
from app.models.user import User
from app.core.encryption import decrypt_field
from app.services.report_service import (
    create_download_token,
    generate_pdf,
    verify_download_token,
)

router = APIRouter()

_expert = require_role("chuyen_gia")

# Local storage path for generated PDFs (swap for S3 in production)
REPORTS_DIR = Path("/tmp/tuvi_reports")
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


class ReportRequest(BaseModel):
    chart_id: uuid.UUID
    client_id: uuid.UUID | None = None   # optional — links expert's client to the report


@router.post("/")
async def generate_report(
    body: ReportRequest,
    current_user: User = Depends(_expert),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a branded PDF lá số report.
    Returns a signed download URL valid for 24 h.
    """
    # Fetch chart — must be owned by the expert or linked to one of their clients
    chart_result = await db.execute(select(Chart).where(Chart.chart_id == body.chart_id))
    chart = chart_result.scalar_one_or_none()
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    if chart.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Resolve client name
    client_name = chart.name
    if body.client_id:
        client_result = await db.execute(select(Client).where(Client.client_id == body.client_id))
        client = client_result.scalar_one_or_none()
        if client and client.expert_id == current_user.user_id:
            client_name = client.name

    dob = decrypt_field(chart.dob_solar_enc)
    birth_hour = decrypt_field(chart.birth_hour_enc)

    pdf_bytes = generate_pdf(
        client_name=client_name,
        dob=dob,
        gender=chart.gender,
        birth_hour=birth_hour,
        chart_matrix=chart.chart_matrix,
        interpretation=chart.ai_interpretation,
        expert_name=current_user.email,
    )

    report_id = str(uuid.uuid4())
    pdf_path = REPORTS_DIR / f"{report_id}.pdf"
    pdf_path.write_bytes(pdf_bytes)

    token = create_download_token(report_id)
    return {
        "download_url": f"/api/v1/reports/download/{token}",
        "expires_in_hours": 24,
    }


@router.get("/download/{token}")
async def download_report(token: str):
    """Stream the PDF if the signed token is valid and not expired."""
    report_id = verify_download_token(token)
    if not report_id:
        raise HTTPException(status_code=410, detail="Link expired or invalid")

    pdf_path = REPORTS_DIR / f"{report_id}.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename="la_so_tu_vi.pdf",
    )
