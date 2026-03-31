import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/wav", "audio/mp4"}
ALLOWED_PDF_TYPE = "application/pdf"


class Attachment(Base):
    __tablename__ = "attachments"

    attachment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.client_id", ondelete="CASCADE"), nullable=False, index=True
    )
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("appointments.appointment_id", ondelete="SET NULL"), nullable=True
    )

    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(100), nullable=False)   # MIME type
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)    # bytes
    storage_path: Mapped[str] = mapped_column(String(1000), nullable=False)

    upload_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    client: Mapped["Client"] = relationship("Client", back_populates="attachments")  # noqa: F821
    appointment: Mapped["Appointment | None"] = relationship("Appointment", back_populates="attachments")  # noqa: F821
