import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.annotation import Annotation
from app.models.user import User
from app.schemas.annotation import AnnotationCreateRequest, AnnotationResponse, AnnotationUpdateRequest

router = APIRouter()


@router.post("/", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED)
async def create_annotation(
    body: AnnotationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    annotation = Annotation(
        user_id=current_user.user_id,
        chart_id=body.chart_id,
        house_number=body.house_number,
        star_name=body.star_name,
        content=body.content,
    )
    db.add(annotation)
    await db.commit()
    await db.refresh(annotation)
    return annotation


@router.get("/", response_model=list[AnnotationResponse])
async def list_annotations(
    chart_id: uuid.UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Annotation).where(Annotation.user_id == current_user.user_id)
    if chart_id:
        q = q.where(Annotation.chart_id == chart_id)
    result = await db.execute(q.order_by(Annotation.modified_at.desc()))
    return result.scalars().all()


@router.patch("/{annotation_id}", response_model=AnnotationResponse)
async def update_annotation(
    annotation_id: uuid.UUID,
    body: AnnotationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    annotation = await _get_owned_annotation(db, annotation_id, current_user.user_id)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(annotation, field, value)
    await db.commit()
    await db.refresh(annotation)
    return annotation


@router.delete("/{annotation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_annotation(
    annotation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    annotation = await _get_owned_annotation(db, annotation_id, current_user.user_id)
    await db.delete(annotation)
    await db.commit()


async def _get_owned_annotation(db: AsyncSession, annotation_id: uuid.UUID, user_id: uuid.UUID) -> Annotation:
    result = await db.execute(select(Annotation).where(Annotation.annotation_id == annotation_id))
    annotation = result.scalar_one_or_none()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    if annotation.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return annotation
