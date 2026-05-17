import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Client(Base):
    """Professional CRM — client profile owned by an expert (Chuyên_Gia)."""

    __tablename__ = "clients"

    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expert_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    # Tags stored as a simple array of strings (OR-filtered)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String(100)), nullable=False, default=list)

    last_consultation: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    expert: Mapped["User"] = relationship("User", foreign_keys=[expert_id])  # noqa: F821
    appointments: Mapped[list["Appointment"]] = relationship("Appointment", back_populates="client", cascade="all, delete-orphan")  # noqa: F821
    attachments: Mapped[list["Attachment"]] = relationship("Attachment", back_populates="client", cascade="all, delete-orphan")  # noqa: F821
