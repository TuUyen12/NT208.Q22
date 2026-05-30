from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class RegisterResponse(BaseModel):
    user_id: UUID
    email: str
    full_name: Optional[str]
    streak_count: int

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    user_id: UUID
    email: str
    full_name: Optional[str] = None
    streak_count: int
    notify_channel: str = "email"
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    has_password: bool = False

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    notify_channel: Optional[str] = None

    @field_validator("notify_channel")
    @classmethod
    def valid_channel(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("email", "push", "both"):
            raise ValueError("notify_channel must be email, push, or both")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v