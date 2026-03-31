from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 — registers all ORM models before routers import them
from app.config import get_settings
from app.core.rate_limit import rate_limit
from app.routers import (
    ai_interpretation,
    annotations,
    appointments,
    attachments,
    auth,
    calendar,
    charts,
    clients,
    journal,
    notifications,
    reports,
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


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
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
app.include_router(clients.router,           prefix=f"{API_PREFIX}/clients",       tags=["CRM — Clients"],       dependencies=_rate_limited)
app.include_router(appointments.router,      prefix=f"{API_PREFIX}/appointments",  tags=["CRM — Appointments"],  dependencies=_rate_limited)
app.include_router(attachments.router,       prefix=f"{API_PREFIX}/attachments",   tags=["CRM — Attachments"],   dependencies=_rate_limited)
app.include_router(reports.router,           prefix=f"{API_PREFIX}/reports",       tags=["CRM — Reports"],       dependencies=_rate_limited)
app.include_router(notifications.router,     prefix=f"{API_PREFIX}/notifications", tags=["Notifications"],       dependencies=_rate_limited)


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
