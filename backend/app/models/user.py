import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)  # null for OAuth users

    # OAuth
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    facebook_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

    role: Mapped[str] = mapped_column(
        Enum("nguoi_dung", "nghien_cuu", "chuyen_gia", name="user_role"),
        default="nguoi_dung",
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    streak_count: Mapped[int] = mapped_column(default=0)

    # Notification preferences
    notify_channel: Mapped[str] = mapped_column(
        Enum("email", "push", "both", name="notify_channel"),
        default="email",
    )

    # Relationships
    charts: Mapped[list["Chart"]] = relationship("Chart", back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    annotations: Mapped[list["Annotation"]] = relationship("Annotation", back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    journal_logs: Mapped[list["JournalLog"]] = relationship("JournalLog", back_populates="user", cascade="all, delete-orphan")  # noqa: F821
