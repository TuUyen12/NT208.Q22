import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = os.getenv("ENV_FILE", ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, env_file_encoding="utf-8")

    # App
    APP_NAME: str = "Tử Vi API"
    DEBUG: bool = False

    # Database — required
    DATABASE_URL: str

    # Redis — required
    REDIS_URL: str

    # JWT — SECRET_KEY required; no default so startup fails if unset
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # OAuth2 — Google
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"

    # AES-256 encryption key — required; no default so startup fails if unset
    FIELD_ENCRYPTION_KEY: str

    # Gemini AI
    GEMINI_API_KEY: str = ""

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # File upload limits (bytes)
    MAX_AUDIO_SIZE: int = 50 * 1024 * 1024
    MAX_PDF_SIZE: int = 10 * 1024 * 1024

    # PDF report download link TTL
    PDF_LINK_TTL_HOURS: int = 24

    # Frontend URL (used for OAuth redirects)
    FRONTEND_URL: str = "http://localhost:4173"

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:4173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
