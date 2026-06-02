import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
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


_RESET_TOKEN_TTL = 900  # 15 minutes


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(body: ForgotPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    # Always return 200 — never reveal whether the email exists
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user and user.hashed_password:  # only for password-based accounts
        token = secrets.token_urlsafe(32)
        redis = request.app.state.redis
        await redis.setex(f"pwd_reset:{token}", _RESET_TOKEN_TTL, str(user.user_id))

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        await _send_reset_email(user.email, user.full_name or user.email, reset_url)

    return {"detail": "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu."}


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(body: ResetPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    redis = request.app.state.redis
    user_id = await redis.get(f"pwd_reset:{body.token}")
    if not user_id:
        raise HTTPException(status_code=400, detail="Token không hợp lệ hoặc đã hết hạn.")

    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Token không hợp lệ hoặc đã hết hạn.")

    from app.core.security import hash_password
    user.hashed_password = hash_password(body.new_password)
    await db.commit()
    await redis.delete(f"pwd_reset:{body.token}")


async def _send_reset_email(to: str, name: str, reset_url: str) -> None:
    from app.services.notification_service import _send_email
    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f131c;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#1a1d2e;border-radius:16px;overflow:hidden;
                      border:1px solid rgba(237,177,255,0.15);">
          <tr>
            <td style="background:linear-gradient(135deg,#2d1b4e,#1a0d35);
                        padding:28px 32px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#edb1ff;letter-spacing:2px;">YinYang</div>
              <div style="font-size:13px;color:#b39ddb;margin-top:4px;">Tử Vi Phương Đông</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:18px;font-weight:600;color:#f0e6ff;margin-bottom:12px;">
                Chào {name},
              </div>
              <div style="font-size:14px;color:#9e8daa;line-height:1.7;margin-bottom:24px;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.<br>
                Link bên dưới có hiệu lực trong <b style="color:#edb1ff;">15 phút</b>.
              </div>
              <div style="text-align:center;margin-bottom:24px;">
                <a href="{reset_url}"
                   style="display:inline-block;padding:14px 32px;
                          background:linear-gradient(135deg,#edb1ff,#6d208c);
                          color:#111;font-weight:700;text-decoration:none;
                          border-radius:10px;font-size:15px;">
                  Đặt lại mật khẩu
                </a>
              </div>
              <div style="font-size:12px;color:#6b5f75;line-height:1.7;">
                Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.<br>
                Mật khẩu của bạn sẽ không thay đổi.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
    try:
        await _send_email(to, "YinYang — Đặt lại mật khẩu", html)
    except Exception:
        pass  # fail silently — user sees generic success message regardless