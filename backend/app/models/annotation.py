import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Annotation(Base):
    __tablename__ = "annotations"

    annotation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    chart_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("charts.chart_id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Reference within the chart
    house_number: Mapped[int | None] = mapped_column(nullable=True)   # 1–12
    star_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    modified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="annotations")  # noqa: F821
    chart: Mapped["Chart"] = relationship("Chart", back_populates="annotations")  # noqa: F821
