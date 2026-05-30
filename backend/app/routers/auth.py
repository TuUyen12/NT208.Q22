from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
)
from app.services.auth_service import AuthService

router = APIRouter()
settings = get_settings()


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Registration failed")  # never expose why
    user = await AuthService.register(db, body.email, body.password, body.full_name)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not AuthService.verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user.last_login = datetime.utcnow()
    await db.commit()
    return AuthService.create_tokens(str(user.user_id))


@router.get("/google/login")
async def google_login():
    url = AuthService.google_auth_url()
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    user = await AuthService.google_callback(db, code)
    tokens = AuthService.create_tokens(str(user.user_id))
    return RedirectResponse(
        f"{settings.FRONTEND_URL}/auth/callback"
        f"?access_token={tokens.access_token}"
        f"&refresh_token={tokens.refresh_token}"
    )



@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    data = UserResponse.model_validate(current_user)
    data.has_password = current_user.hashed_password is not None
    return data


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.full_name is not None:
        current_user.full_name = body.full_name.strip() or None
    if body.notify_channel is not None:
        current_user.notify_channel = body.notify_channel
    await db.commit()
    await db.refresh(current_user)
    data = UserResponse.model_validate(current_user)
    data.has_password = current_user.hashed_password is not None
    return data


@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not AuthService.verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")
    from app.core.security import hash_password
    current_user.hashed_password = hash_password(body.new_password)
    await db.commit()


@router.delete("/me", status_code=status.HTTP_202_ACCEPTED)
async def request_account_deletion(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Queue deletion — data removed within 30 days (Req 23)."""
    await AuthService.queue_deletion(db, current_user)
    return {"detail": "Deletion request received. Data will be removed within 30 days."}