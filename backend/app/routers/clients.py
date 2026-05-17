import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_role
from app.models.client import Client
from app.models.user import User
from app.schemas.client import (
    BulkExportRequest,
    BulkTagRequest,
    ClientCreateRequest,
    ClientResponse,
    ClientUpdateRequest,
)

router = APIRouter()

_expert = require_role("chuyen_gia")


@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    body: ClientCreateRequest,
    current_user: User = Depends(_expert),
    db: AsyncSession = Depends(get_db),
):
    client = Client(expert_id=current_user.user_id, **body.model_dump())
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client


@router.get("/", response_model=list[ClientResponse])
async def list_clients(
    tags: list[str] | None = None,
    current_user: User = Depends(_expert),
    db: AsyncSession = Depends(get_db),
):
    q = select(Client).where(Client.expert_id == current_user.user_id)
    if tags:
        # OR filter logic (Req 13)
        q = q.where(Client.tags.overlap(tags))
    result = await db.execute(q.order_by(Client.name))
    return result.scalars().all()


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: uuid.UUID,
    current_user: User = Depends(_expert),
    db: AsyncSession = Depends(get_db),
):
    return await _get_owned_client(db, client_id, current_user.user_id)


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: uuid.UUID,
    body: ClientUpdateRequest,
    current_user: User = Depends(_expert),
    db: AsyncSession = Depends(get_db),
):
    client = await _get_owned_client(db, client_id, current_user.user_id)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(client, field, value)
    await db.commit()
    await db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: uuid.UUID,
    current_user: User = Depends(_expert),
    db: AsyncSession = Depends(get_db),
):
    client = await _get_owned_client(db, client_id, current_user.user_id)
    await db.delete(client)
    await db.commit()


# --- Bulk operations (Req 12) ---

@router.post("/bulk/tag", status_code=status.HTTP_200_OK)
async def bulk_tag(
    body: BulkTagRequest,
    current_user: User = Depends(_expert),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Client).where(
            Client.expert_id == current_user.user_id,
            Client.client_id.in_(body.client_ids),
        )
    )
    clients = result.scalars().all()
    for client in clients:
        client.tags = list(set(client.tags) | set(body.tags))
    await db.commit()
    return {"updated": len(clients)}


@router.post("/bulk/export")
async def bulk_export(
    body: BulkExportRequest,
    current_user: User = Depends(_expert),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Client).where(
            Client.expert_id == current_user.user_id,
            Client.client_id.in_(body.client_ids),
        )
    )
    clients = result.scalars().all()

    import csv, io, json
    if body.format == "csv":
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(["client_id", "name", "email", "phone", "tags", "last_consultation"])
        for c in clients:
            writer.writerow([c.client_id, c.name, c.email, c.phone, ",".join(c.tags), c.last_consultation])
        buf.seek(0)
        return StreamingResponse(buf, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=clients.csv"})
    else:
        data = [{"client_id": str(c.client_id), "name": c.name, "email": c.email} for c in clients]
        return data


async def _get_owned_client(db: AsyncSession, client_id: uuid.UUID, expert_id: uuid.UUID) -> Client:
    result = await db.execute(select(Client).where(Client.client_id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if client.expert_id != expert_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return client
