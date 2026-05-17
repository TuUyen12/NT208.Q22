import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Chart(Base):
    """Lá_Số — astrology chart for a person."""

    __tablename__ = "charts"

    chart_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Birth data (sensitive fields encrypted at rest)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)       # "male" | "female"
    dob_solar_enc: Mapped[str] = mapped_column(Text, nullable=False)       # AES-256 encrypted ISO date
    birth_hour_enc: Mapped[str] = mapped_column(Text, nullable=False)      # AES-256 encrypted HH:MM

    # Computed lunar date (derived, stored for fast access)
    dob_lunar_year: Mapped[int | None] = mapped_column(nullable=True)
    dob_lunar_month: Mapped[int | None] = mapped_column(nullable=True)
    dob_lunar_day: Mapped[int | None] = mapped_column(nullable=True)
    dob_lunar_leap: Mapped[bool] = mapped_column(default=False)

    # Star placement result (Ma_Trận_Lá_Số)
    chart_matrix: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Researcher configuration
    configuration_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chart_configurations.configuration_id", ondelete="SET NULL"), nullable=True
    )

    # AI interpretation (cached)
    ai_interpretation: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ai_cached_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="charts")  # noqa: F821
    configuration: Mapped["ChartConfiguration | None"] = relationship("ChartConfiguration", back_populates="charts")
    annotations: Mapped[list["Annotation"]] = relationship("Annotation", back_populates="chart", cascade="all, delete-orphan")  # noqa: F821


class ChartConfiguration(Base):
    """Named configuration of star placement rules for researchers."""

    __tablename__ = "chart_configurations"

    configuration_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    rules: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    charts: Mapped[list["Chart"]] = relationship("Chart", back_populates="configuration")
