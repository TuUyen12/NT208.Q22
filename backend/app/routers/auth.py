from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Registration failed")  # never expose why
    user = await AuthService.register(db, body.email, body.password)
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


@router.get("/google/callback", response_model=TokenResponse)
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    user = await AuthService.google_callback(db, code)
    return AuthService.create_tokens(str(user.user_id))


@router.get("/facebook/login")
async def facebook_login():
    url = AuthService.facebook_auth_url()
    return RedirectResponse(url)


@router.get("/facebook/callback", response_model=TokenResponse)
async def facebook_callback(code: str, db: AsyncSession = Depends(get_db)):
    user = await AuthService.facebook_callback(db, code)
    return AuthService.create_tokens(str(user.user_id))


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.delete("/me", status_code=status.HTTP_202_ACCEPTED)
async def request_account_deletion(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Queue deletion — data removed within 30 days (Req 23)."""
    await AuthService.queue_deletion(db, current_user)
    return {"detail": "Deletion request received. Data will be removed within 30 days."}
