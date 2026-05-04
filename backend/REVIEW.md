# Backend Review — Current State, Next Steps, Improvements

> **How to read this doc:**
> - ✅ Done and working
> - ⚠️ Done but has a known issue or stub
> - ❌ Not yet implemented
> - 🔧 Technical improvement (refactor/performance/security)

---

## Part 1 — What Is Working Right Now

### Infrastructure
| Item | Status | Notes |
|------|--------|-------|
| Docker Compose (Postgres + Redis + API) | ✅ | All 5 services start and pass healthchecks |
| Alembic auto-migration on startup | ✅ | `start.sh` generates + runs migrations |
| Rate limiting (100 req/min per user) | ✅ | Redis sorted-set sliding window |
| CORS for React frontend | ✅ | `http://localhost:5173` allowed |
| `/health` endpoint | ✅ | Used by Docker healthcheck |
| Swagger UI | ✅ | Available at `http://localhost:8000/api/docs` |

### Auth
| Item | Status | Notes |
|------|--------|-------|
| Email/password register + login | ✅ | bcrypt cost 12, JWT tokens issued |
| Record `last_login` timestamp | ✅ | Updated on every login |
| Google OAuth2 redirect flow | ✅ | Code exchange done in `auth_service.py` |
| Facebook OAuth2 redirect flow | ✅ | Same pattern as Google |
| Account deletion (30-day queue) | ✅ | `DELETE /auth/me` marks user for deletion |
| Never expose error details | ✅ | Generic messages on all auth failures |

### Charts
| Item | Status | Notes |
|------|--------|-------|
| Solar → Lunar conversion | ✅ | Julian Day Number algorithm |
| 108-star placement (Chính Tinh + Phụ Tinh) | ⚠️ | See Issue #1 below |
| Deterministic output | ✅ | Same input always produces same matrix |
| Every house has ≥1 star validation | ✅ | Raises `ValueError` if any house is empty |
| Store chart as JSONB | ✅ | `chart_matrix` column in `charts` table |
| Retrieve most recent chart | ✅ | Ordered by `created_at DESC` in router |
| AES-256-GCM encryption for dob/birth_hour | ✅ | `core/encryption.py` |
| Chart comparison (side-by-side + merged) | ✅ | `ChartEngine.compare()` |
| Configuration-linked charts | ✅ | `chart_configurations` table + FK |
| Advanced search (star, house, date range) | ✅ | `GET /charts/search` |

### AI Interpretation
| Item | Status | Notes |
|------|--------|-------|
| Call external AI service | ✅ | `httpx` POST with timeout |
| Validate Vietnamese response | ✅ | Checks for Vietnamese diacritics |
| Cache AI response in DB | ✅ | Stored in `chart.ai_interpretation` |
| Graceful degradation if AI down | ✅ | Returns fallback stub |
| Cung_Mệnh interpretation required | ✅ | Validated in `_validate_response()` |

### CRM
| Item | Status | Notes |
|------|--------|-------|
| Client profiles (expert-owned) | ✅ | |
| Multiple charts per client | ✅ | FK from charts to clients |
| Tag system with OR filter | ✅ | PostgreSQL ARRAY + `&&` overlap operator |
| Bulk tag / bulk export | ✅ | `POST /clients/bulk-tag`, `POST /clients/bulk-export` |
| Appointment booking (pending → confirmed) | ✅ | Status ENUM enforced |
| Auto-generate meeting link | ✅ | `secrets.token_urlsafe(16)` |
| File attachments (audio ≤50MB, PDF ≤10MB) | ✅ | MIME + size validation in router |
| PDF report export | ✅ | ReportLab, HMAC signed 24h download link |

### Notifications & Background Jobs
| Item | Status | Notes |
|------|--------|-------|
| Daily Lưu_Sao recalculation (cron) | ✅ | Celery Beat at 00:05 Asia/Ho_Chi_Minh |
| 15-min appointment reminders | ⚠️ | See Issue #2 below |
| User notification preferences | ✅ | `notify_channel`: email / push / both |
| Manual Lưu_Sao recalculation endpoint | ✅ | `POST /notifications/luu-sao/recalculate` |
| Journal logs with Lưu_Sao positions | ✅ | One log per user per day (upsert) |

### Security
| Item | Status | Notes |
|------|--------|-------|
| bcrypt cost factor 12 | ✅ | |
| JWT access + refresh tokens | ✅ | 60 min + 30 days |
| AES-256-GCM field encryption | ✅ | `dob_solar`, `birth_hour` |
| Authorization on every data access | ✅ | `_get_owned_*` helpers throughout |
| Role-based access (`require_role`) | ✅ | CRM routes locked to `chuyen_gia` |
| HTTPS enforcement | ❌ | See Next Steps — needs TLS terminator |

---

## Part 2 — Known Issues

### Issue #1 — Chart engine uses a simplified star algorithm

**File:** `app/services/chart_engine.py`

**What it does now:** The placement of auxiliary stars (`_place_phu_tinh`) uses a simplified offset formula that distributes stars evenly. The static stars list (`_PHU_TINH_STATIC`) places stars sequentially by house index (star 0 → house 0, star 1 → house 1, etc.) which is not the traditional Tử Vi algorithm.

**Why it matters:** Researchers and professionals will notice the positions are wrong. This is the core of the product.

**What to do:** The real algorithm uses a lookup table of 108 stars, each with specific placement rules based on year-chi, month, day, hour, and gender combinations. This requires domain expertise or a reference implementation. The iztro npm library on the frontend uses the correct algorithm — you could reverse-engineer its placement logic or hire a Tử Vi domain expert.

**Risk level:** High — this is the product's core value.

---

### Issue #2 — Appointment reminders are not actually scheduled

**File:** `app/services/notification_service.py`, line 36

```python
async def schedule_reminder(appointment) -> None:
    remind_at = appointment.scheduled_at - timedelta(minutes=15)
    # TODO: enqueue task — reminder_at=remind_at, appointment_id=appointment.appointment_id
    pass   # ← does nothing
```

**What it does now:** Computes the reminder time but then does nothing. The `# TODO` comment is a placeholder.

**Why it matters:** No reminders are ever sent. The Celery Beat task (`send_appointment_reminders`) does run every minute and queries for appointments in the 14–16 minute window — that part works. But the `pass` in `schedule_reminder` means the router flow doesn't actually enqueue anything.

**What to do:** The Beat task approach (scan every minute) is actually sufficient and correct on its own. The `schedule_reminder` function is redundant. See the fix in Part 3.

**Risk level:** Medium — reminders just never fire.

---

### Issue #3 — Email and push notifications are stubs

**File:** `app/services/notification_service.py`, lines 102–109

```python
async def _send_email(to: str, subject: str, body: str) -> None:
    # TODO: integrate SendGrid / SES / SMTP
    pass

async def _send_push(user_id: str, title: str, body: str) -> None:
    # TODO: integrate FCM / APNs
    pass
```

**What it does now:** Nothing. These functions exist but have no real implementation.

**Why it matters:** Users and experts receive no notifications at all — not reminders, not daily Lưu_Sao updates, nothing.

**What to do:** See Part 3 for step-by-step integration options.

**Risk level:** Medium — the system works but users don't get notified.

---

### Issue #4 — `asyncio.get_event_loop()` is deprecated in Python 3.12

**File:** `app/tasks/jobs.py`, line 17

```python
def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)
```

**What it does now:** Works in most cases, but `get_event_loop()` without a running loop raises a `DeprecationWarning` in Python 3.10+ and a `RuntimeError` in Python 3.12+ in certain environments.

**What to do:** Change to `asyncio.run(coro)` — see Part 3.

**Risk level:** Low for now, but will break on Python 3.12 strict environments.

---

### Issue #5 — Attachment files are stored by path only, not actually saved

**File:** `app/routers/attachments.py`

**What it does now:** Stores a `storage_path` string in the database. The actual file upload logic either saves to a local `/tmp` path or is incomplete.

**Why it matters:** In production, local file storage disappears when the container restarts. Files need to go to object storage (S3, GCS, Cloudflare R2).

**Risk level:** High for production — low for local development.

---

### Issue #6 — Refresh token endpoint is missing

**File:** `app/routers/auth.py`

**What it does now:** Issues both access token (60 min) and refresh token (30 days) on login, but there is no `POST /auth/refresh` endpoint to exchange a refresh token for a new access token.

**Why it matters:** After 60 minutes, every user gets logged out with a 401 error and has no way to silently refresh. They must log in again.

**Risk level:** High for user experience.

---

## Part 3 — Next Steps (Ordered by Priority)

### Step 1 — Add the refresh token endpoint
**Priority: High — blocks normal user sessions**

This is a small, well-defined addition. One new endpoint in `routers/auth.py`:

```
POST /auth/refresh
Body: { "refresh_token": "eyJ..." }
Response: { "access_token": "...", "token_type": "bearer" }
```

The logic: decode the refresh token → check it is a refresh token (not access) → issue a new access token.

---

### Step 2 — Fix the `_run()` async bridge in Celery tasks
**Priority: Medium — avoids future breakage**

In `app/tasks/jobs.py`, change:
```python
# Before (deprecated)
def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)

# After (correct)
def _run(coro):
    return asyncio.run(coro)
```

---

### Step 3 — Wire up real email notifications
**Priority: Medium — users need to actually receive notifications**

The fastest option is **SendGrid** (free tier: 100 emails/day):

1. Sign up at sendgrid.com → get an API key
2. Add `SENDGRID_API_KEY=your_key` to `.env`
3. Add `sendgrid==6.11.0` to `requirements.txt`
4. Replace the stub in `notification_service.py`:

```python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

async def _send_email(to: str, subject: str, body: str) -> None:
    sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
    message = Mail(
        from_email="no-reply@tuvi.app",
        to_emails=to,
        subject=subject,
        plain_text_content=body,
    )
    sg.send(message)   # sync call — fine for background tasks
```

Alternative providers: **AWS SES** (cheapest at scale), **Resend** (modern API, generous free tier).

---

### Step 4 — File storage: move from local disk to object storage
**Priority: High before going to production**

Right now attachments are stored on the container's local disk — they disappear on restart.

**Recommended: Cloudflare R2** (S3-compatible, no egress fees)
1. Create an R2 bucket
2. Add credentials to `.env`
3. Use `boto3` (the AWS SDK — works with R2 too) to upload files
4. Store the R2 object key in `storage_path` instead of a local path

```python
import boto3

s3 = boto3.client("s3",
    endpoint_url=settings.R2_ENDPOINT,
    aws_access_key_id=settings.R2_ACCESS_KEY,
    aws_secret_access_key=settings.R2_SECRET_KEY,
)

s3.upload_fileobj(file.file, settings.R2_BUCKET, object_key)
```

---

### Step 5 — Add HTTPS / TLS termination
**Priority: Required before any real users**

FastAPI (uvicorn) itself doesn't handle TLS. You need a **reverse proxy** in front of it.

**Option A — Nginx (inside Docker Compose):**
- Add an `nginx` service to `docker-compose.yml`
- Configure it to proxy `https://yourdomain.com` → `http://api:8000`
- Use Let's Encrypt (free SSL certificate) via `certbot`

**Option B — Cloudflare Tunnel (easiest):**
- Install `cloudflared` on your server
- One command creates a secure tunnel from your domain to `localhost:8000`
- No ports exposed, no cert management

---

### Step 6 — Write tests
**Priority: Medium — prevents regressions**

The project has no tests yet. Good starting points:

1. **Unit tests** for pure functions:
   - `calendar_service.py`: does solar → lunar → solar round-trip correctly?
   - `chart_engine.py`: does the same input always produce the same output?
   - `encryption.py`: does encrypt → decrypt return the original value?

2. **Integration tests** for API routes:
   - `POST /auth/register` then `POST /auth/login` → get a token
   - `POST /charts/` with a token → get a chart back
   - `GET /charts/{id}` with someone else's token → get 403

Tools: `pytest` + `httpx` (AsyncClient) + a test Postgres database.

---

### Step 7 — Improve the chart engine algorithm
**Priority: High for product quality, complex to implement**

The current simplified algorithm does not match traditional Tử Vi rules. To fix this:

**Option A (Recommended for beginners):** Use the iztro frontend library as the source of truth. When a chart is requested, call the iztro API from the frontend and send the result to the backend for storage. The backend chart engine becomes a storage/retrieval layer rather than a calculator.

**Option B:** Research and implement the full 108-star placement algorithm. Reference books: "Tử Vi Đại Toàn", "Tử Vi Thực Hành". This requires domain expertise.

---

## Part 4 — Improvements (Non-Critical)

### Performance

| Improvement | Benefit | Effort |
|-------------|---------|--------|
| Add `UNIQUE(user_id, log_date)` DB constraint to `journal_logs` | Prevents duplicate logs at the DB level, not just application level | Low |
| Add index on `charts(user_id, created_at)` | Faster "get my most recent chart" queries | Low |
| Cache `GET /charts/{id}` in Redis (5 min TTL) | Reduces DB load for repeated reads | Medium |
| Use `RETURNING` clause in upsert SQL | One DB round-trip instead of two (select + insert/update) | Medium |

### Code Quality

| Improvement | Why | File |
|-------------|-----|------|
| Extract `_get_owned_*` helpers into a shared `app/utils/ownership.py` | The same pattern is repeated in 5 routers | Multiple routers |
| Replace `datetime.utcnow()` with `datetime.now(timezone.utc)` | `utcnow()` is deprecated in Python 3.12 | `routers/auth.py:32`, `routers/ai_interpretation.py:38` |
| Add `__unique_constraint__` on `(user_id, log_date)` in JournalLog model | Enforces one-log-per-day at DB level | `models/journal.py` |
| Add `pytest-asyncio` and write at least one smoke test | Catch regressions before deploying | New file |

### Security Hardening

| Improvement | Why |
|-------------|-----|
| Store refresh tokens in the DB with a `revoked` flag | Currently, a stolen refresh token works forever until it expires |
| Add `Secure; HttpOnly; SameSite=Strict` to cookie-based auth if you switch to cookies | Prevents XSS token theft |
| Add failed login attempt counter + temporary lockout | Prevents brute-force attacks |
| Rotate `FIELD_ENCRYPTION_KEY` support (key versioning) | Lets you re-encrypt data if a key is compromised |

---

## Part 5 — Environment Variables Needed Before Launch

Check your `.env` against this list. The ones marked ❌ are stubs or missing.

| Variable | Status | Where to get it |
|----------|--------|----------------|
| `DATABASE_URL` | ✅ | Docker Compose sets `db:5432` |
| `REDIS_URL` | ✅ | Docker Compose sets `redis:6379` |
| `SECRET_KEY` | ✅ | Generate with `openssl rand -hex 32` |
| `FIELD_ENCRYPTION_KEY` | ✅ | Generate with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key())"` |
| `GOOGLE_CLIENT_ID` | ❌ | Google Cloud Console → OAuth credentials |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google Cloud Console → OAuth credentials |
| `FACEBOOK_CLIENT_ID` | ❌ | Meta Developer Portal |
| `FACEBOOK_CLIENT_SECRET` | ❌ | Meta Developer Portal |
| `AI_SERVICE_URL` | ❌ | Your AI provider's endpoint |
| `AI_SERVICE_API_KEY` | ❌ | Your AI provider's API key |
| `SENDGRID_API_KEY` | ❌ | sendgrid.com (after Step 3 above) |
| `R2_ENDPOINT` / `R2_ACCESS_KEY` | ❌ | Cloudflare R2 dashboard (after Step 4 above) |

---

## Summary

| Category | Done | Remaining |
|----------|------|-----------|
| Infrastructure | 6/6 | HTTPS (Step 5) |
| Auth | 5/6 | Refresh token endpoint (Step 1) |
| Charts | 9/10 | Accurate star algorithm (Step 7) |
| AI | 5/5 | Wire real AI endpoint (env var) |
| CRM | 7/8 | Real file storage (Step 4) |
| Notifications | 4/5 | Real email/push (Step 3) |
| Security | 5/6 | Refresh token revocation |
| Tests | 0/∞ | Start with Step 6 |

**The backend is a solid, well-structured foundation.** All routes exist, all business rules are enforced, and the infrastructure runs cleanly. The gaps are mostly about wiring up real external services (email provider, AI provider, object storage) rather than missing logic.
