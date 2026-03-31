import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.dependencies import require_role
from app.models.attachment import Attachment, ALLOWED_AUDIO_TYPES, ALLOWED_PDF_TYPE
from app.models.client import Client
from app.models.user import User

router = APIRouter()
settings = get_settings()

_expert = require_role("chuyen_gia")


@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    client_id: uuid.UUID = Form(...),
    appointment_id: uuid.UUID | None = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(_expert),
    db: AsyncSession = Depends(get_db),
):
    # Verify client ownership
    result = await db.execute(select(Client).where(Client.client_id == client_id))
    client = result.scalar_one_or_none()
    if not client or client.expert_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Validate file type and size (Req 14)
    content_type = file.content_type
    is_audio = content_type in ALLOWED_AUDIO_TYPES
    is_pdf = content_type == ALLOWED_PDF_TYPE

    if not (is_audio or is_pdf):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    contents = await file.read()
    file_size = len(contents)

    max_size = settings.MAX_AUDIO_SIZE if is_audio else settings.MAX_PDF_SIZE
    if file_size > max_size:
        raise HTTPException(status_code=413, detail=f"File exceeds maximum size")

    # TODO: persist to object storage (S3/GCS); store path
    storage_path = f"uploads/{current_user.user_id}/{client_id}/{file.filename}"

    attachment = Attachment(
        client_id=client_id,
        appointment_id=appointment_id,
        file_name=file.filename,
        file_type=content_type,
        file_size=file_size,
        storage_path=storage_path,
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    return {"attachment_id": attachment.attachment_id, "file_name": attachment.file_name}


@router.get("/{attachment_id}/download-url")
async def get_download_url(
    attachment_id: uuid.UUID,
    current_user: User = Depends(_expert),
    db: AsyncSession = Depends(get_db),
):
    """Return a signed download URL valid for 24h (Req 15)."""
    result = await db.execute(select(Attachment).where(Attachment.attachment_id == attachment_id))
    attachment = result.scalar_one_or_none()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # TODO: generate signed URL from object storage
    signed_url = f"/files/{attachment.storage_path}?token=signed&ttl={settings.PDF_LINK_TTL_HOURS}h"
    return {"url": signed_url, "expires_in_hours": settings.PDF_LINK_TTL_HOURS}
