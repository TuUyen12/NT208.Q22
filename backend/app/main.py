import secrets
from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from prometheus_fastapi_instrumentator import Instrumentator

import app.models  # noqa: F401 — registers all ORM models before routers import them
from app.core.config import get_settings
from app.core.rate_limit import rate_limit
from app.routers import (
    ai_interpretation,
    annotations,
    auth,
    calendar,
    charts,
    chat,
    daily_horoscope,
    journal,
    notifications,
)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — create Redis connection pool
    app.state.redis = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )
    yield
    # Shutdown — close Redis pool
    await app.state.redis.aclose()


_basic = HTTPBasic(auto_error=False)


def _docs_auth(credentials: HTTPBasicCredentials | None = Depends(_basic)):
    u = settings.DOCS_USERNAME
    p = settings.DOCS_PASSWORD
    if not u or not p:
        return  # auth not configured — allow freely (dev)
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            headers={"WWW-Authenticate": "Basic"},
        )
    ok = secrets.compare_digest(credentials.username, u) and \
         secrets.compare_digest(credentials.password, p)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            headers={"WWW-Authenticate": "Basic"},
        )


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
)
Instrumentator().instrument(app).expose(app, endpoint="/api/metrics")

app.include_router(
    daily_horoscope.router,
    prefix="/api/v1/daily-horoscope",
    tags=["Daily Horoscope"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"

# Global rate-limit dependency applied to all authenticated routes below
_rate_limited = [Depends(rate_limit)]

app.include_router(auth.router,              prefix=f"{API_PREFIX}/auth",          tags=["Auth"])
app.include_router(charts.router,            prefix=f"{API_PREFIX}/charts",        tags=["Charts"],              dependencies=_rate_limited)
app.include_router(calendar.router,          prefix=f"{API_PREFIX}/calendar",      tags=["Calendar"],            dependencies=_rate_limited)
app.include_router(ai_interpretation.router, prefix=f"{API_PREFIX}/ai",            tags=["AI Interpretation"],   dependencies=_rate_limited)
app.include_router(annotations.router,       prefix=f"{API_PREFIX}/annotations",   tags=["Annotations"],         dependencies=_rate_limited)
app.include_router(journal.router,           prefix=f"{API_PREFIX}/journal",       tags=["Journal"],             dependencies=_rate_limited)
app.include_router(notifications.router,     prefix=f"{API_PREFIX}/notifications", tags=["Notifications"],       dependencies=_rate_limited)
app.include_router(chat.router,              prefix=f"{API_PREFIX}/chat",          tags=["Chat"],                dependencies=_rate_limited)

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}


@app.get("/api/openapi.json", include_in_schema=False)
async def openapi_json(_: None = Depends(_docs_auth)):
    return app.openapi()


@app.get("/api/docs", include_in_schema=False)
async def swagger_ui(_: None = Depends(_docs_auth)):
    return get_swagger_ui_html(openapi_url="/api/openapi.json", title=f"{settings.APP_NAME} — Docs")


@app.get("/api/redoc", include_in_schema=False)
async def redoc(_: None = Depends(_docs_auth)):
    return get_redoc_html(openapi_url="/api/openapi.json", title=f"{settings.APP_NAME} — ReDoc")
