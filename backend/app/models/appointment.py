import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.client_id", ondelete="CASCADE"), nullable=False, index=True
    )
    expert_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )

    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("pending", "confirmed", "cancelled", name="appointment_status"),
        default="pending",
        nullable=False,
    )
    payment_status: Mapped[str] = mapped_column(
        Enum("unpaid", "paid", "refunded", name="payment_status"),
        default="unpaid",
        nullable=False,
    )
    meeting_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    client: Mapped["Client"] = relationship("Client", back_populates="appointments")  # noqa: F821
    expert: Mapped["User"] = relationship("User", foreign_keys=[expert_id])  # noqa: F821
    attachments: Mapped[list["Attachment"]] = relationship("Attachment", back_populates="appointment")  # noqa: F821
