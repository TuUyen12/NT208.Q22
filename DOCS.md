# YinYang — Complete Project Documentation

> Vietnamese Tử Vi (Purple Star Astrology) web platform.  
> Backend: FastAPI + PostgreSQL + Redis + Celery  
> Frontend: React (Vite) + iztro library  

---

## Table of Contents

1. [Big Picture](#1-big-picture)
2. [User Roles](#2-user-roles)
3. [Infrastructure & Docker](#3-infrastructure--docker)
4. [Backend — File-by-File](#4-backend--file-by-file)
   - [Entry Point](#41-entry-point--appmainpy)
   - [Core Modules](#42-core-modules-appcore)
   - [Database Layer](#43-database-layer)
   - [Dependencies (Auth Guards)](#44-dependencies-appdependenciespy)
   - [Models](#45-models-appmodels)
   - [Schemas](#46-schemas-appschemas)
   - [Routers (API Endpoints)](#47-routers-approuters)
   - [Services (Business Logic)](#48-services-appservices)
   - [Background Tasks (Celery)](#49-background-tasks-apptasks)
   - [Database Migrations (Alembic)](#410-database-migrations-alembic)
5. [Frontend — File-by-File](#5-frontend--file-by-file)
   - [Entry & Routing](#51-entry--routing)
   - [Auth Context](#52-auth-context)
   - [API Client](#53-api-client-configapijs)
   - [Services Layer](#54-services-layer)
   - [Pages](#55-pages)
   - [Components](#56-components)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [Security Architecture](#7-security-architecture)
8. [Glossary](#8-glossary-tử-vi-terms)

---

## 1. Big Picture

```
Browser (React)
    │
    │  REST JSON  /api/v1/…
    ▼
FastAPI (port 8000)
    │
    ├── PostgreSQL  — persistent data
    ├── Redis       — rate-limit counters + daily horoscope cache
    └── Celery      — background jobs
          ├── worker  — executes tasks
          └── beat    — cron scheduler (daily Lưu_Sao + minute reminder check)
```

The product lets users:
- Enter birth data → generate a **Lá Số Tử Vi** (astrology chart) client-side with the `iztro` library
- Save charts to the backend (birth data encrypted at rest)
- Get an **AI interpretation** of their chart from Google Gemini
- Chat with an AI **Tử Vi chatbot** (personalized with their chart)
- Get a **daily horoscope** (cached in Redis per user per day)
- Keep a **journal** of daily notes linked to moving-star (Lưu Sao) positions
- Experts (`chuyen_gia`) can manage **clients**, **appointments**, **attachments**, and generate **PDF reports**

---

## 2. User Roles

Three roles stored in the `users.role` column:

| Role | Vietnamese | Description |
|------|-----------|-------------|
| `nguoi_dung` | Người Dùng | Regular user — can create charts, journal, chatbot |
| `nghien_cuu` | Nghiên Cứu | Researcher — everything above + named chart configurations, advanced search, batch recalculate |
| `chuyen_gia` | Chuyên Gia | Expert/Consultant — everything above + CRM (clients, appointments, attachments, PDF reports) |

---

## 3. Infrastructure & Docker

### `docker-compose.yml`

Defines 6 services:

| Service | Image/Build | Port | Purpose |
|---------|------------|------|---------|
| `db` | postgres:16-alpine | 5432 | PostgreSQL database |
| `redis` | redis:7-alpine | 6379 | Cache + message broker for Celery |
| `api` | `./backend` Dockerfile | 8000 | FastAPI app |
| `worker` | `./backend` Dockerfile | — | Celery worker (task execution) |
| `beat` | `./backend` Dockerfile | — | Celery beat (cron scheduler) |
| `frontend` | `./Frontend` Dockerfile | 4173 | React app (Nginx) |

**Startup order:** `db` → `redis` → `api` → `worker` + `beat` + `frontend`

The `api` service runs `backend/start.sh` which:
1. Runs `alembic upgrade head` (applies DB migrations)
2. Starts `uvicorn` on port 8000

### `monitoring/`
- `prometheus.yml` — Prometheus scrape config (scrapes `/metrics` from the API)
- `monitoring/docker-compose.yml` — separate Compose stack for Prometheus + Grafana

### `nginx/yinyang.io.vn.conf`
Nginx reverse proxy config for production (yinyang.io.vn domain).

---

## 4. Backend — File-by-File

### 4.1 Entry Point — `app/main.py`

The FastAPI application factory. Key things it does:

**Lifespan handler** (runs at startup/shutdown):
```python
app.state.redis = aioredis.from_url(settings.REDIS_URL)  # shared Redis connection pool
```

**Middleware:**
- `CORSMiddleware` — allows the frontend origins listed in `ALLOWED_ORIGINS`

**Prometheus metrics:**
- `Instrumentator().instrument(app).expose(app, endpoint="/metrics")` — auto-instruments every route with latency/count metrics

**Route registration:**
```
/api/v1/auth/            → auth router (no rate limit)
/api/v1/charts/          → charts router (rate limited)
/api/v1/calendar/        → calendar router (rate limited)
/api/v1/ai/              → AI interpretation router (rate limited)
/api/v1/annotations/     → annotations router (rate limited)
/api/v1/journal/         → journal router (rate limited)
/api/v1/clients/         → CRM clients router (rate limited)
/api/v1/appointments/    → CRM appointments router (rate limited)
/api/v1/attachments/     → CRM attachments router (rate limited)
/api/v1/reports/         → PDF reports router (rate limited)
/api/v1/notifications/   → notifications router (rate limited)
/api/v1/chat/            → chatbot router (rate limited)
/api/v1/daily-horoscope/ → daily horoscope router (rate limited)
/health                  → simple health check (returns {"status": "ok"})
```

**Why daily-horoscope is registered before `add_middleware`:**  
The horoscope endpoint was added before CORS middleware, but since CORS middleware applies to all routes regardless of registration order, this has no practical effect. It's just code ordering.

---

### 4.2 Core Modules (`app/core/`)

#### `config.py` — Application Settings

```python
class Settings(BaseSettings):
    DATABASE_URL: str          # PostgreSQL async URL
    REDIS_URL: str             # Redis URL
    SECRET_KEY: str            # JWT signing key (required, no default)
    FIELD_ENCRYPTION_KEY: str  # AES-256 key as hex (required, no default)
    GEMINI_API_KEY: str        # Google Gemini API key
    RATE_LIMIT_REQUESTS: int = 100  # per window
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    MAX_AUDIO_SIZE: int = 50MB
    MAX_PDF_SIZE: int = 10MB
    PDF_LINK_TTL_HOURS: int = 24
    ALLOWED_ORIGINS: list[str]
```

`get_settings()` is decorated with `@lru_cache` — settings are read from `.env` once and reused (singleton pattern).

---

#### `security.py` — JWT & Password Hashing

| Function | Purpose |
|----------|---------|
| `hash_password(password)` | bcrypt hash with 12 rounds (cost factor ≥ 12 for security) |
| `verify_password(plain, hashed)` | bcrypt comparison |
| `create_access_token(subject)` | Creates JWT with `type: access`, expires in 60 min |
| `create_refresh_token(subject)` | Creates JWT with `type: refresh`, expires in 30 days |
| `decode_access_token(token)` | Decodes JWT, validates type == "access", returns payload or None |

The `subject` is always the `user_id` (UUID string).  
JWTs use HS256 algorithm with the app's `SECRET_KEY`.

---

#### `encryption.py` — AES-256-GCM Field Encryption

Used to encrypt **birth date** and **birth hour** before storing in the DB.

| Function | Purpose |
|----------|---------|
| `encrypt_field(plaintext)` | Generates random 12-byte nonce, encrypts with AES-GCM, returns `base64(nonce + ciphertext)` |
| `decrypt_field(ciphertext)` | Decodes base64, splits nonce/ciphertext, decrypts |

The key is stored as a hex string in `FIELD_ENCRYPTION_KEY` env var. Why AES-GCM? It's authenticated encryption — provides both confidentiality and integrity.

---

#### `rate_limit.py` — Sliding Window Rate Limiter

```python
async def rate_limit(request, current_user):
    # Uses Redis sorted set: key = "rate:{user_id}"
    # Scores = timestamps; removes entries older than the window
    # Counts current entries; raises 429 if > RATE_LIMIT_REQUESTS
```

**How the sliding window works:**
1. `ZREMRANGEBYSCORE` — remove timestamps older than `now - 60s`
2. `ZADD` — add current timestamp
3. `ZCARD` — count entries in window
4. `EXPIRE` — auto-cleanup after window expires

Applied globally to all authenticated routes via `dependencies=_rate_limited` in `main.py`.

---

### 4.3 Database Layer

#### `database.py`

```python
engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

class Base(DeclarativeBase): pass  # All ORM models inherit from this

async def get_db() -> AsyncSession:
    # FastAPI dependency — yields a session, rolls back on exception
```

`expire_on_commit=False` means ORM objects remain usable after `commit()` without issuing new SELECT queries — important for async code.

`pool_pre_ping=True` tests DB connections before use to handle dropped connections.

---

### 4.4 Dependencies (`app/dependencies.py`)

Two FastAPI dependency functions used throughout routers:

#### `get_current_user`
1. Extracts `Bearer <token>` from `Authorization` header
2. Calls `decode_access_token()` — returns 401 if invalid
3. Queries DB for the user by `user_id` from token's `sub` claim
4. Returns the `User` ORM object

#### `require_role(*roles)`
A **factory function** that returns a FastAPI dependency.

```python
_expert = require_role("chuyen_gia")          # reusable dependency
_researcher = require_role("nghien_cuu", "chuyen_gia")
```

Calls `get_current_user` then checks `user.role in roles`. Returns 403 if not.

---

### 4.5 Models (`app/models/`)

All models inherit from `Base` (SQLAlchemy ORM, async).

#### `user.py` — `User`

```
users
├── user_id        UUID PK
├── email          unique, indexed
├── full_name      nullable
├── hashed_password nullable (null for OAuth users)
├── google_id      unique, nullable
├── facebook_id    unique, nullable
├── role           Enum: nguoi_dung | nghien_cuu | chuyen_gia
├── is_active      bool (false = queued for deletion)
├── created_at
├── last_login     nullable
├── streak_count   int (login streak)
└── notify_channel Enum: email | push | both
```

Relationships:
- `charts` → one-to-many → `Chart` (cascade delete)
- `annotations` → one-to-many → `Annotation` (cascade delete)
- `journal_logs` → one-to-many → `JournalLog` (cascade delete)

---

#### `chart.py` — `Chart` + `ChartConfiguration`

```
charts
├── chart_id           UUID PK
├── user_id            FK → users (cascade delete)
├── name               person's name
├── gender             "male" | "female"
├── dob_solar_enc      AES-256 encrypted ISO date string
├── birth_hour_enc     AES-256 encrypted "HH:MM"
├── dob_lunar_year/month/day/leap  computed lunar date (plain text for fast queries)
├── chart_matrix       JSONB — the full 12-palace star placement from iztro
├── configuration_id   FK → chart_configurations (nullable)
├── ai_interpretation  JSONB — cached Gemini response
├── ai_cached_at       timestamp of AI cache
└── created_at
```

```
chart_configurations
├── configuration_id  UUID PK
├── user_id           FK → users
├── name              config name
├── rules             JSONB — custom star placement rules
└── created_at
```

**Why is `chart_matrix` stored?** The `iztro` library runs in the browser. The backend stores the result so you don't recompute it every time and can do server-side search/comparison.

---

#### `client.py` — `Client` (CRM)

```
clients
├── client_id         UUID PK
├── expert_id         FK → users (only chuyen_gia can own clients)
├── name, email, phone, notes
├── tags              ARRAY(String) — for OR-filtered search
├── last_consultation Date
└── created_at
```

Relationships: `appointments`, `attachments` (both cascade delete).

---

#### `appointment.py` — `Appointment`

```
appointments
├── appointment_id  UUID PK
├── client_id       FK → clients (cascade delete)
├── expert_id       FK → users
├── scheduled_at    DateTime (with timezone)
├── status          Enum: pending | confirmed | cancelled
├── payment_status  Enum: unpaid | paid | refunded
├── meeting_link    auto-generated secure URL
├── notes
└── created_at
```

---

#### `annotation.py` — `Annotation`

User notes attached to a specific chart, optionally pinned to a house (1-12) or star name.

```
annotations
├── annotation_id  UUID PK
├── user_id        FK → users
├── chart_id       FK → charts
├── house_number   1-12, nullable
├── star_name      nullable
├── content        text
├── created_at
└── modified_at    auto-updated on change
```

---

#### `journal.py` — `JournalLog`

One log per user per date. Records daily notes + the daily moving-star (Lưu Sao) positions.

```
journal_logs
├── log_id             UUID PK
├── user_id            FK → users
├── log_date           Date (indexed)
├── content            text (nullable)
└── luu_sao_positions  JSONB — {star_name: house_number, ...}
```

---

#### `attachment.py` — `Attachment`

Files (audio recordings or PDFs) attached to a client. Supports: mp3, wav, m4a, pdf.

```
attachments
├── attachment_id   UUID PK
├── client_id       FK → clients (cascade delete)
├── appointment_id  FK → appointments (set null on delete, nullable)
├── file_name, file_type (MIME), file_size (bytes)
├── storage_path    path in object storage (TODO: S3/GCS)
└── upload_date
```

---

### 4.6 Schemas (`app/schemas/`)

Pydantic models for request validation and response serialization.

| File | Key Schemas |
|------|------------|
| `auth.py` | `RegisterRequest`, `LoginRequest`, `TokenResponse`, `UserResponse`, `RegisterResponse` |
| `chart.py` | `ChartCreateRequest`, `ChartResponse`, `ChartSearchRequest`, `ChartCompareRequest`, `ConfigurationCreateRequest`, `ConfigurationResponse` |
| `client.py` | `ClientCreateRequest`, `ClientUpdateRequest`, `ClientResponse`, `BulkTagRequest`, `BulkExportRequest` |
| `appointment.py` | `AppointmentCreateRequest`, `AppointmentUpdateRequest`, `AppointmentResponse` |
| `annotation.py` | `AnnotationCreateRequest`, `AnnotationUpdateRequest`, `AnnotationResponse` |
| `journal.py` | `JournalLogCreate`, `JournalLogUpdate`, `JournalLogResponse` |

---

### 4.7 Routers (`app/routers/`)

#### `auth.py` — Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | None | Create account. Returns 400 generically on duplicate (never reveals why) |
| POST | `/login` | None | Email+password login. Updates `last_login`. Returns access + refresh tokens |
| GET | `/google/login` | None | Redirects to Google OAuth consent screen |
| GET | `/google/callback` | None | Receives OAuth `code`, exchanges for tokens, redirects to frontend with tokens in URL |
| GET | `/me` | JWT | Returns current user info |
| DELETE | `/me` | JWT | Marks `is_active=False` (soft delete). Data removed within 30 days by a background job |

---

#### `charts.py` — Lá Số Management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/compare` | JWT | Compare two charts. Body: `{chart_id_a, chart_id_b, view}`. View: "side_by_side" or "merged". Returns compatibility score |
| POST | `/search` | JWT | Filter charts by date range and/or star name and/or house number |
| POST | `/configurations` | Researcher+ | Save a named chart configuration (custom star rules) |
| GET | `/configurations` | Researcher+ | List own configurations |
| GET | `/latest` | JWT | Get the user's most recently created chart |
| POST | `/` | JWT | **Create/save a chart.** Receives `chart_matrix` from frontend iztro, encrypts birth data, converts solar→lunar, stores |
| GET | `/` | JWT | List all own charts (newest first) |
| GET | `/{chart_id}` | JWT | Get a specific chart (decrypts birth data in response) |
| DELETE | `/{chart_id}` | JWT | Delete a chart |

**Key design note:** `/compare`, `/search`, `/configurations`, `/latest` are all registered BEFORE `/{chart_id}` to prevent FastAPI from treating those path segments as UUID params.

**`_build_chart_response`** — decrypts `dob_solar_enc` and `birth_hour_enc` before returning to the client.

---

#### `ai_interpretation.py` — AI Chart Reading

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/{chart_id}/interpret` | JWT | Generate Gemini interpretation. Returns cached result if `ai_interpretation` already set |

Cache strategy: interpretation is stored in `charts.ai_interpretation` (JSONB). Once generated, it never expires unless the chart is deleted.

---

#### `chat.py` — Tử Vi Chatbot

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | JWT | Multi-turn chat with Gemini. Loads user's latest chart for personalized context |

**Request body:**
```json
{
  "message": "Cung Mệnh của tôi có ý nghĩa gì?",
  "history": [{"role": "user", "text": "..."}, {"role": "model", "text": "..."}]
}
```

The system prompt includes:
- Role definition (Tử Vi expert at YinYang)
- User's chart summary (from `_summarise_matrix`)
- Previous AI interpretation if available

Only the last 10 messages from history are sent to Gemini (context window management).

---

#### `daily_horoscope.py` — Daily Horoscope

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | JWT | Get today's personalized horoscope |

**Caching strategy:**
1. Check Redis key `horoscope:{user_id}:{YYYY-MM-DD}`
2. If hit → return immediately
3. If miss → call Gemini, cache with TTL = seconds until midnight UTC
4. Falls back to generic horoscope if user has no chart

---

#### `calendar.py` — Date Conversion

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/solar-to-lunar` | None | Gregorian → Vietnamese lunar date |
| POST | `/lunar-to-solar` | None | Lunar → Gregorian (round-trip) |

No authentication required (public utility endpoints).

---

#### `clients.py` — CRM Client Management (Expert only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Expert | Create a client profile |
| GET | `/` | Expert | List clients. Optional `?tags=tag1&tags=tag2` for OR-filter |
| GET | `/{client_id}` | Expert | Get one client |
| PATCH | `/{client_id}` | Expert | Update client fields |
| DELETE | `/{client_id}` | Expert | Delete client (cascades to appointments + attachments) |
| POST | `/bulk/tag` | Expert | Add tags to multiple clients at once |
| POST | `/bulk/export` | Expert | Export client list as CSV or JSON |

---

#### `appointments.py` — CRM Appointments (Expert only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Expert | Create appointment. Auto-generates meeting link. Schedules 15-min reminder |
| PATCH | `/{appointment_id}` | Expert | Update status, payment_status, notes, etc. |
| GET | `/` | Expert | List all appointments ordered by scheduled time |

---

#### `attachments.py` — CRM File Uploads (Expert only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Expert | Upload audio (mp3/wav/m4a, max 50MB) or PDF (max 10MB). Validates MIME type and size |
| GET | `/{attachment_id}/download-url` | Expert | Get signed download URL (24h TTL) |

**Note:** Storage path is computed but actual file write to S3/GCS is marked TODO. Currently, the metadata is stored but the file bytes are not persisted beyond the request.

---

#### `annotations.py` — Chart Annotations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | JWT | Create annotation on a chart (optionally pin to house/star) |
| GET | `/` | JWT | List annotations. Optional `?chart_id=...` filter |
| PATCH | `/{annotation_id}` | JWT | Update annotation content |
| DELETE | `/{annotation_id}` | JWT | Delete annotation |

---

#### `journal.py` — Daily Journal

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | JWT | Create or update (upsert) journal log for a date. Auto-computes Lưu Sao positions |
| GET | `/` | JWT | List logs. Optional `?date_from=...&date_to=...` filter |
| GET | `/{log_date}` | JWT | Get log for specific date (YYYY-MM-DD) |
| PATCH | `/{log_date}` | JWT | Update content of existing log |
| DELETE | `/{log_date}` | JWT | Delete a log |

---

#### `notifications.py` — Notifications & Lưu Sao

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/luu-sao` | JWT | Get today's Lưu Sao positions. Creates today's journal log if not exists |
| POST | `/luu-sao/refresh` | JWT | Force-recalculate Lưu Sao for today |
| POST | `/daily-recalculate` | Expert/Researcher | Batch recalculate for ALL active users (also called by Celery cron) |
| POST | `/test-send` | JWT | Send a test notification via user's preferred channel |

---

#### `reports.py` — PDF Report Export (Expert only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Expert | Generate branded PDF lá số report. Returns signed download URL |
| GET | `/download/{token}` | None | Stream the PDF if token is valid and not expired |

---

### 4.8 Services (`app/services/`)

#### `auth_service.py` — `AuthService`

| Method | Purpose |
|--------|---------|
| `verify_password(plain, hashed)` | bcrypt check, handles null hash for OAuth users |
| `register(db, email, password, full_name)` | Hashes password, creates User, commits |
| `create_tokens(user_id)` | Returns `TokenResponse` with access + refresh tokens |
| `google_auth_url()` | Builds Google OAuth redirect URL |
| `google_callback(db, code)` | Exchanges OAuth code for tokens, fetches user info, upserts User |
| `queue_deletion(db, user)` | Sets `is_active=False` (data removal happens in background job) |

---

#### `chart_engine.py` — `ChartEngine` (Tử Vi Calculation)

The core astrology calculation engine. **Note:** In practice, iztro runs in the browser and the result (`chart_matrix`) is sent to the backend. The backend's `ChartEngine` is used for server-side features like comparison and search.

**Constants:**
- `CHI` — 12 earthly branches (Tý, Sửu, Dần, …, Hợi)
- `HOUR_TO_CHI` — maps pairs of hours to branch index
- `_CHINH_TINH` — 14 main stars
- `_PHU_TINH_*` — 45+ auxiliary stars split into year-based, birth-chi-based, and static groups

**Private functions:**

| Function | Purpose |
|----------|---------|
| `_hour_to_chi_index(birth_hour)` | Converts "HH:MM" → branch index 0-11 |
| `_cung_menh(lunar_month, birth_chi)` | Calculates the Life Palace (Cung Mệnh) house index |
| `_cung_than(lunar_year, birth_chi)` | Calculates the Body Palace (Cung Thân) house index |
| `_place_chinh_tinh(lunar_day)` | Places 14 main stars across 12 houses using canonical Tử Vi algorithm |
| `_place_phu_tinh(lunar_year, birth_chi, gender)` | Places 45+ auxiliary stars |
| `_compatibility_score(a, b)` | Overlap-based score 0.0–1.0 between two chart matrices |

**Public API:**

| Method | Purpose |
|--------|---------|
| `ChartEngine.solar_to_lunar(solar_date, tz)` | Delegates to `CalendarService` |
| `ChartEngine.calculate(lunar, birth_hour, gender)` | Full chart calculation → `{"1": [...stars], ..., "12": [...]}` |
| `ChartEngine.compare(matrix_a, matrix_b, view)` | Side-by-side or merged comparison with compatibility score |

---

#### `calendar_service.py` — `CalendarService`

Implements Vietnamese astronomical lunar calendar conversion (valid 1900–2100).

| Method | Purpose |
|--------|---------|
| `solar_to_lunar(solar_date, timezone_offset)` | Gregorian → `{year, month, day, is_leap_month}` |
| `lunar_to_solar(lunar_year, month, day, is_leap, tz)` | Lunar → `{solar_date: "YYYY-MM-DD"}` |

**Low-level helpers:**

| Function | Purpose |
|----------|---------|
| `_solar_to_jd(dd, mm, yy)` | Date → Julian Day Number |
| `_jd_to_solar(jd)` | Julian Day → (day, month, year) |
| `_new_moon(k)` | Julian day of the k-th new moon (astronomical formula) |
| `_sun_longitude(jd, tz)` | Sun longitude in 30° sectors (used to find month 11 / leap months) |
| `_get_lunar_month_11(yy, tz)` | JD of the start of lunar month 11 for a given year |
| `_jd_to_lunar(jd, tz)` | Julian Day → `{year, month, day, is_leap_month}` |
| `_find_leap_month(a11, tz)` | Find which month index is the leap month in a year |
| `_lunar_to_jd(dd, mm, yy, is_leap, tz)` | Lunar date → Julian Day |

---

#### `ai_service.py` — `AIService`

Handles chart interpretation via Google Gemini.

| Function/Method | Purpose |
|----------------|---------|
| `_summarise_matrix(matrix)` | Converts raw iztro JSONB → compact Vietnamese text. Translates Chinese palace names to Vietnamese (命宫→Mệnh, etc.) |
| `_build_prompt(matrix)` | Builds the full Gemini prompt asking for structured JSON output with 7 fields |
| `AIService.interpret(chart_matrix)` | Calls Gemini, parses JSON response, handles markdown code fences, falls back gracefully |
| `_fallback()` | Returns a stub dict when Gemini is unavailable |

**Output JSON structure:**
```json
{
  "overall": "...",        // 3-4 paragraph general reading
  "cung_menh": "...",     // Life Palace analysis
  "cung_tai_bach": "...", // Wealth Palace
  "cung_quan_loc": "...", // Career Palace
  "cung_phu_the": "...", // Marriage Palace
  "dai_han": "...",       // Decadal cycles
  "luu_y": "..."          // Advice / warnings
}
```

---

#### `notification_service.py` — `NotificationService`

| Method | Purpose |
|--------|---------|
| `generate_meeting_link()` | Returns `https://meet.tuvi.app/{token}` with a 16-byte random token |
| `schedule_reminder(appointment)` | TODO stub — should enqueue a Celery delayed task |
| `recalculate_luu_sao(db, user_id)` | Compute today's Lưu Sao positions, upsert today's journal log |
| `daily_recalculate_all(db)` | Iterate all active users, call `recalculate_luu_sao` for each |
| `send(user, subject, body)` | Dispatch via user's `notify_channel` (email, push, or both) |

**Private helpers:**

| Function | Purpose |
|----------|---------|
| `_send_email(to, subject, body)` | TODO stub — wire SendGrid/SES/SMTP |
| `_send_push(user_id, title, body)` | TODO stub — wire FCM/APNs |
| `_calculate_luu_sao(today)` | Deterministic formula: positions for Lưu Thái Tuế, Lưu Thiên Mã, Lưu Lộc Tồn, Lưu Hao, Lưu Hình, Lưu Kị based on `year % 12` |

---

#### `report_service.py` — PDF Generation

| Function | Purpose |
|----------|---------|
| `generate_pdf(client_name, dob, gender, birth_hour, chart_matrix, interpretation, expert_name)` | Builds PDF using ReportLab. Returns bytes |
| `_build_grid_table(chart_matrix)` | Creates 4×4 ReportLab `Table` representing 12 palaces + 2×2 center cell |
| `_add_watermark(canvas, doc)` | Draws "YIN♾️YANG" watermark at 45° on each page |
| `create_download_token(report_id)` | HMAC-SHA256 signed token: `{report_id}:{timestamp}:{signature}` |
| `verify_download_token(token)` | Verifies signature + checks 24h TTL. Returns `report_id` or `None` |

**Grid layout** — palace positions in the 4×4 grid:
```
 [3] [2] [1] [0]   ← top row (palaces 4,3,2,1 in 0-indexed)
 [4] [C] [C] [11]  ← C = center cell (2×2 span)
 [5] [C] [C] [10]
 [6] [7] [8] [9]   ← bottom row
```

---

### 4.9 Background Tasks (`app/tasks/`)

#### `celery_app.py` — Celery Configuration

```python
celery_app = Celery("tuvi", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.timezone = "Asia/Ho_Chi_Minh"

beat_schedule = {
    "daily-luu-sao-recalculation": crontab(hour=0, minute=5),  # 00:05 ICT every day
    "appointment-reminder-check":  crontab(),                   # every minute
}
```

Redis is used as both the **broker** (task queue) and **backend** (result storage).

---

#### `jobs.py` — Task Implementations

**Task 1: `recalculate_luu_sao_all_users`**
- Runs at 00:05 ICT daily
- Creates its own async DB session (Celery tasks are sync, wrapped with `asyncio.get_event_loop().run_until_complete()`)
- Calls `NotificationService.daily_recalculate_all(db)`
- Retries up to 3 times with 5-minute delay on failure

**Task 2: `send_appointment_reminders`**
- Runs every minute
- Finds all `confirmed` appointments with `scheduled_at` in the 14–16 minute future window
- Sends notification to the expert via their preferred channel
- Retries up to 2 times with 30-second delay

---

### 4.10 Database Migrations (Alembic)

Located in `backend/alembic/`.

| File | Purpose |
|------|---------|
| `alembic.ini` | Points to `backend/alembic/` as the migration directory |
| `alembic/env.py` | Connects Alembic to the async SQLAlchemy engine, imports all models |
| `alembic/versions/5ee7f6aca042_init.py` | Initial migration — creates all tables |
| `alembic/versions/add_full_name_to_users.py` | Adds `full_name` column to `users` |

Run migrations: `alembic upgrade head` (done automatically on startup via `start.sh`).

---

## 5. Frontend — File-by-File

### 5.1 Entry & Routing

#### `main.jsx`
React entry point. Mounts `<App />` into `#root`.

#### `App.jsx`

Defines all routes:

| Path | Component | Protected? |
|------|-----------|-----------|
| `/` | `HomePage` | No |
| `/login` | `LoginPage` | No |
| `/signup` | `SignUp` | No |
| `/auth/callback` | `AuthCallback` | No |
| `/major-stars` | `MajorStars` | No |
| `/chatbot` | `Chatbot` | Yes |
| `/la-so-tu-vi` | `LaSoTuVi` | Yes |
| `*` | Redirect to `/` | — |

**`ProtectedRoute`** — reads `user` from `AuthContext`. If loading (token validation in progress), renders nothing. If no user, redirects to `/login`.

---

### 5.2 Auth Context

#### `contexts/AuthContext.jsx`

Global authentication state. Wraps the entire app.

**State:**
- `user` — current user object from `/api/v1/auth/me`, or `null`
- `loading` — true only when there's a stored token being validated (not always true on page load)

**Functions:**

| Function | Purpose |
|----------|---------|
| `login(email, password, remember)` | POST to `/auth/login`, stores tokens in `localStorage` (remember=true) or `sessionStorage`, fetches `/auth/me` |
| `loginWithTokens(access, refresh)` | Used after OAuth redirect — tokens come from URL params |
| `logout()` | Clears all tokens from both storages, sets `user = null` |
| `register(email, password, fullName)` | Delegates to `authService.register` |

**Token storage logic:**
- `remember=true` → `localStorage` (persists across browser sessions)
- `remember=false` → `sessionStorage` (clears when tab closes)
- On page load, if a token exists, validates it by calling `/auth/me`

---

### 5.3 API Client (`config/api.js`)

Central fetch wrapper.

```javascript
const api = {
  get:    (path, opts) => request("GET", path, opts),
  post:   (path, body, opts) => request("POST", path, { body, ...opts }),
  patch:  (path, body, opts) => request("PATCH", path, { body, ...opts }),
  delete: (path, opts) => request("DELETE", path, opts),
}
```

**`request(method, path, {body, auth=true})`:**
1. Reads token from `localStorage` → `sessionStorage` (in that order)
2. Adds `Authorization: Bearer <token>` header if `auth=true`
3. Throws with `data.detail` on non-2xx responses
4. Returns `null` on 204 No Content

`VITE_API_URL` env var sets the base URL (empty string in dev = same origin via Vite proxy).

---

### 5.4 Services Layer

#### `services/authService.js`
```javascript
authService.register(email, password, fullName)  // POST /auth/register
authService.login(email, password)               // POST /auth/login → {access_token, refresh_token}
authService.me()                                 // GET /auth/me → user object
authService.deleteMe()                           // DELETE /auth/me
authService.googleLoginUrl()                     // Returns the Google OAuth redirect URL
```

#### `services/chartService.js`
```javascript
chartService.save(payload)    // POST /charts/ — save chart from iztro
chartService.list()           // GET /charts/
chartService.get(id)          // GET /charts/{id}
chartService.delete(id)       // DELETE /charts/{id}
chartService.latest()         // GET /charts/latest
chartService.interpret(id)    // POST /ai/{id}/interpret — trigger AI interpretation
```

#### `services/iztroService.js` — `generateChartData(formData)`

The main chart generation function. Runs entirely in the browser.

1. Parses `birthDate` + `birthHour` into year/month/day/hour
2. Calls `astro.bySolar(solarDate, branchHour, gender, false, "zh-CN")` from `iztro` library
3. Converts the solar date to lunar using the `solarlunar` library
4. Maps each palace to a UI-friendly structure:
   ```javascript
   {
     StemBranch: "...",          // e.g., "Giáp Dần"
     PalaceName: "...",          // e.g., "Mệnh"
     majorStarsFull: [...],      // raw iztro star objects
     minorStarsFull: [...],
     adjectiveStarsFull: [...],
     MainStars: ["Tử Vi", ...],  // translated names
     LeftStars: [...],           // first 4 minor stars
     RightStars: [...],          // next 4 minor stars
   }
   ```
5. Builds `centerInfo` with birth details, element class, yin-yang

**`convertHourToBranch(hour)`** — converts 24h clock hour to iztro's branch index (0-11). The mapping follows the 2-hour segments of the Chinese hour system.

#### `services/interpretationService.js` — `generateInterpretations(palaceData)`

Client-side rule-based interpretation (used before or instead of AI).

**`specialRules`** — array of `{condition, result}` objects. Evaluated in order, first match wins. Examples:
- Cung Mệnh tại Dần có Lộc Tồn → "Là người giàu khó và khéo giữ gìn"
- Cung Tài Bạch có Lộc Tồn → specific wealth reading
- Phu Thê có Hồng Loan + Thiên Hỷ → marriage blessing

**`starInterpretations`** — nested object: `{palace_name: {star_name: "interpretation text"}}`. Covers the 12 palaces × 14 main stars.

**`interpretPalace(palace, palaceName)`** — decision tree:
1. Check special rules first
2. If no main stars (vô chính diệu) → general message
3. Look up star in `starInterpretations` table
4. If found, check for bad stars (Kình Dương, Đà La, etc.) and append warning
5. Fallback: list all stars generically

---

### 5.5 Pages

#### `pages/Home.jsx`
Landing page. Features sections, call-to-action buttons, navigation to login/signup.

#### `pages/Login.jsx`
Login form with email/password + "Remember me" checkbox + Google OAuth button. Uses `useAuth().login()` and `authService.googleLoginUrl()`.

#### `pages/SignUp.jsx`
Registration form. Calls `useAuth().register()`.

#### `pages/AuthCallback.jsx`
OAuth landing page. Reads `access_token` + `refresh_token` from URL params, calls `loginWithTokens()`, then navigates to `/la-so-tu-vi`.

#### `pages/LaSoTuVi.jsx`
The main chart page. Core flow:
1. User fills birth form (date, hour, gender, target year)
2. `generateChartData()` from `iztroService` runs in-browser
3. `ChartLayout` renders the 4×4 palace grid
4. `AnalysisSection` shows interpretations
5. "Lưu Lá Số" button → calls `chartService.save()` with the matrix
6. "Luận Giải AI" button → calls `chartService.interpret(id)` for Gemini reading

#### `pages/Chatbot.jsx`
Chat interface. Maintains conversation `history` array. Sends messages to `/api/v1/chat/`. Displays streaming replies in a chat bubble UI.

#### `pages/MajorStars.jsx`
Static educational page describing the 14 major stars of Tử Vi.

---

### 5.6 Components

#### `components/ChartLayout.jsx`
Renders the 4×4 grid layout. Places 12 `PalaceCell` components at fixed grid positions + the `CenterInfo` in the 2×2 center span.

**Grid mapping (counter-clockwise from top-left):**
```
palace[0]  palace[1]  palace[2]  palace[3]   ← top row
palace[4]  [CENTER--][CENTER--]  palace[6]   ← left, center, right
palace[5]  [CENTER--][CENTER--]  palace[7]
palace[8]  palace[9]  palace[10] palace[11]  ← bottom row
```

#### `components/PalaceCell.jsx`
Single palace cell. Displays:
- `StemBranch` (can-chi)
- `PalaceName`
- `MainStars` (major stars)
- `LeftStars` / `RightStars` (minor stars)
- Age range (`Age`)

#### `components/CenterCell.jsx` / `CenterInfo`
Center 2×2 cell. Displays:
- Gender, solar date, lunar date
- Birth hour
- Yin-yang, element class (Cục)
- Target year for annual chart (Lưu Niên)

#### `components/AnalysisSection.jsx`
Renders the list of palace interpretations below the chart. Each section has a `title` (palace name) and `content` (interpretation text) rendered as cards.

---

## 6. Data Flow Diagrams

### Chart Creation Flow

```
User enters birth data
        │
        ▼
iztroService.generateChartData()    ← runs in browser
  calls iztro library (astro.bySolar)
  calls solarlunar library
        │
        ▼
palaceData + centerInfo (12 palaces, stars, lunar date)
        │
        ▼ (user clicks "Save")
chartService.save({
  name, gender, dob_solar, birth_hour,
  chart_matrix: {palaces data},
  timezone_offset: 7
})
        │
        ▼ POST /api/v1/charts/
backend/charts.py → create_chart()
  encrypt dob_solar → dob_solar_enc
  encrypt birth_hour → birth_hour_enc
  convert solar → lunar (CalendarService)
  store Chart in PostgreSQL
        │
        ▼
Returns chart with chart_id
```

### AI Interpretation Flow

```
User clicks "Luận Giải AI"
        │
        ▼ POST /api/v1/ai/{chart_id}/interpret
backend checks: chart.ai_interpretation exists?
  YES → return cached {"cached": true}
  NO  → call AIService.interpret(chart_matrix)
           _summarise_matrix() → Vietnamese text
           _build_prompt() → structured prompt
           POST to Gemini API
           Parse JSON response
           Store in chart.ai_interpretation
           Return {"cached": false}
```

### Daily Horoscope Flow

```
User opens app / clicks horoscope
        │
        ▼ GET /api/v1/daily-horoscope/
Check Redis key: "horoscope:{user_id}:{today}"
  HIT → return immediately (cached=true)
  MISS →
    Load user's latest chart from DB
    Build personalized prompt (or generic if no chart)
    Call Gemini API
    Store in Redis with TTL = seconds until midnight UTC
    Return horoscope (cached=false)
```

---

## 7. Security Architecture

| Concern | Implementation |
|---------|---------------|
| **Password storage** | bcrypt, cost factor 12 |
| **Authentication** | JWT HS256, 60-min access token, 30-day refresh token |
| **Birth data at rest** | AES-256-GCM encrypted (`dob_solar_enc`, `birth_hour_enc`) |
| **Authorization** | Role-based guards via `require_role()` FastAPI dependency |
| **Rate limiting** | Sliding window, 100 req/60s per user, enforced in Redis |
| **CORS** | Explicit origin allowlist |
| **File validation** | MIME type + size checked before accepting uploads |
| **Download links** | HMAC-SHA256 signed tokens with 24h TTL |
| **OAuth** | Google OAuth2 code flow, no client-side secrets exposed |
| **Error messages** | Registration errors are generic ("Registration failed") to avoid user enumeration |
| **Account deletion** | Soft-delete via `is_active=False`, hard deletion within 30 days |

---

## 8. Glossary — Tử Vi Terms

| Term | Vietnamese | Meaning |
|------|-----------|---------|
| Lá Số | Lá Số Tử Vi | Astrology chart / natal chart |
| Cung | Cung | Palace (one of 12 houses in the chart) |
| Chính Tinh | Chính Tinh | Main/major stars (14 total) |
| Phụ Tinh | Phụ Tinh | Auxiliary/minor stars |
| Lưu Sao | Lưu Sao | Moving stars — daily positions that shift year to year |
| Lưu Niên | Lưu Niên | Annual chart — the chart for a specific target year |
| Đại Hạn | Đại Hạn | Decadal cycle — 10-year period of influence |
| Can | Thiên Can | Heavenly Stem (10 stems: Giáp, Ất, Bính…) |
| Chi | Địa Chi | Earthly Branch (12 branches: Tý, Sửu, Dần…) |
| Cục | Cục | "Element class" — one of 5 elemental types that sets the chart's foundational energy |
| Cung Mệnh | Cung Mệnh | Life Palace — the palace that defines core personality |
| Cung Thân | Cung Thân | Body Palace — the palace of physical/worldly manifestation |
| Vô Chính Diệu | Vô Chính Diệu | "No main star" — a palace with no major stars |
| Sát Tinh | Sát Tinh | Malefic stars (Kình Dương, Đà La, Hỏa Tinh, Linh Tinh, etc.) |
| Lộc Tồn | Lộc Tồn | Wealth-retaining star |
| Thiên Mã | Thiên Mã | Travel/movement star |
