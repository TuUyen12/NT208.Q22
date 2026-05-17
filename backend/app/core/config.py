from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # App
    APP_NAME: str = "Tử Vi API"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://tuvi:tuvi@localhost:5432/tuvi"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # OAuth2 — Google
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"

    # OAuth2 — Facebook
    FACEBOOK_CLIENT_ID: str = ""
    FACEBOOK_CLIENT_SECRET: str = ""
    FACEBOOK_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/facebook/callback"

    # AES-256 encryption key for sensitive fields (32-byte hex)
    FIELD_ENCRYPTION_KEY: str = "change-me-32-byte-hex-key-000000"

    # AI service
    AI_SERVICE_URL: str = ""
    AI_SERVICE_API_KEY: str = ""

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # File upload limits (bytes)
    MAX_AUDIO_SIZE: int = 50 * 1024 * 1024   # 50 MB
    MAX_PDF_SIZE: int = 10 * 1024 * 1024      # 10 MB

    # PDF report download link TTL
    PDF_LINK_TTL_HOURS: int = 24

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
