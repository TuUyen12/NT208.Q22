from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Later files override earlier ones — .env.local wins over .env on local dev
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        env_file_override=True,
    )

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

    # API Docs basic auth (leave empty to disable auth — dev only)
    DOCS_USERNAME: str = ""
    DOCS_PASSWORD: str = ""

    # Email — Google SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""        # Gmail account used for auth
    SMTP_PASSWORD: str = ""    # Gmail App Password (not login password)
    SMTP_FROM: str = ""        # From address shown to recipients (alias); falls back to SMTP_USER


@lru_cache
def get_settings() -> Settings:
    return Settings()
