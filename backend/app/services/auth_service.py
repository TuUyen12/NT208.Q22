import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import TokenResponse

settings = get_settings()


class AuthService:
    @staticmethod
    def verify_password(plain: str, hashed: str | None) -> bool:
        if not hashed:
            return False
        return verify_password(plain, hashed)

    @staticmethod
    async def register(db: AsyncSession, email: str, password: str) -> User:
        user = User(email=email, hashed_password=hash_password(password))
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    def create_tokens(user_id: str) -> TokenResponse:
        return TokenResponse(
            access_token=create_access_token(user_id),
            refresh_token=create_refresh_token(user_id),
        )

    @staticmethod
    def google_auth_url() -> str:
        params = (
            f"client_id={settings.GOOGLE_CLIENT_ID}"
            f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
            "&response_type=code"
            "&scope=openid email profile"
        )
        return f"https://accounts.google.com/o/oauth2/v2/auth?{params}"

    @staticmethod
    async def google_callback(db: AsyncSession, code: str) -> User:
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
            token_resp.raise_for_status()
            id_token = token_resp.json().get("id_token")

            userinfo_resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token_resp.json()['access_token']}"},
            )
            userinfo_resp.raise_for_status()
            info = userinfo_resp.json()

        from sqlalchemy import select
        result = await db.execute(select(User).where(User.google_id == info["sub"]))
        user = result.scalar_one_or_none()

        if not user:
            result2 = await db.execute(select(User).where(User.email == info["email"]))
            user = result2.scalar_one_or_none()

        if user:
            user.google_id = info["sub"]
        else:
            user = User(email=info["email"], google_id=info["sub"])
            db.add(user)

        from datetime import datetime
        user.last_login = datetime.utcnow()
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    def facebook_auth_url() -> str:
        params = (
            f"client_id={settings.FACEBOOK_CLIENT_ID}"
            f"&redirect_uri={settings.FACEBOOK_REDIRECT_URI}"
            "&scope=email"
        )
        return f"https://www.facebook.com/v18.0/dialog/oauth?{params}"

    @staticmethod
    async def facebook_callback(db: AsyncSession, code: str) -> User:
        async with httpx.AsyncClient() as client:
            token_resp = await client.get(
                "https://graph.facebook.com/v18.0/oauth/access_token",
                params={
                    "client_id": settings.FACEBOOK_CLIENT_ID,
                    "client_secret": settings.FACEBOOK_CLIENT_SECRET,
                    "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
                    "code": code,
                },
            )
            token_resp.raise_for_status()
            access_token = token_resp.json()["access_token"]

            me_resp = await client.get(
                "https://graph.facebook.com/me",
                params={"fields": "id,email", "access_token": access_token},
            )
            me_resp.raise_for_status()
            info = me_resp.json()

        from sqlalchemy import select
        result = await db.execute(select(User).where(User.facebook_id == info["id"]))
        user = result.scalar_one_or_none()

        if not user and "email" in info:
            result2 = await db.execute(select(User).where(User.email == info["email"]))
            user = result2.scalar_one_or_none()

        if user:
            user.facebook_id = info["id"]
        else:
            user = User(email=info.get("email", f"{info['id']}@facebook.invalid"), facebook_id=info["id"])
            db.add(user)

        from datetime import datetime
        user.last_login = datetime.utcnow()
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def queue_deletion(db: AsyncSession, user: User) -> None:
        # In production: write a deletion_requests record; a background job handles it within 30d
        user.is_active = False
        await db.commit()
