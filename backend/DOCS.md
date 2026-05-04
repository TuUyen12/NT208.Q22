# Backend Deep-Dive Documentation
> Every file, every function, every line explained for beginners.

---

## Table of Contents
1. [How the Internet Works (foundation)](#1-how-the-internet-works)
2. [Project Overview & Request Journey](#2-project-overview--request-journey)
3. [config.py](#3-configpy)
4. [database.py](#4-databasepy)
5. [dependencies.py](#5-dependenciespy)
6. [models/ — Database Tables](#6-models)
7. [schemas/ — Data Validation](#7-schemas)
8. [core/security.py — Passwords & Tokens](#8-coresecuritypy)
9. [core/encryption.py — AES-256](#9-coreencryptionpy)
10. [core/rate_limit.py — Throttling](#10-corerate_limitpy)
11. [routers/ — API Endpoints](#11-routers)
12. [services/ — Business Logic](#12-services)
13. [tasks/ — Background Jobs](#13-tasks)
14. [main.py — App Assembly](#14-mainpy)
15. [Infrastructure Files](#15-infrastructure-files)
16. [Python Concepts Glossary](#16-python-concepts-glossary)
17. [Remaining Models](#17-remaining-models) — appointment, attachment, journal
18. [Remaining Schemas](#18-remaining-schemas) — annotation, appointment, journal, client
19. [Remaining Routers](#19-remaining-routers) — annotations, appointments, journal, AI, notifications
20. [Missing Concepts](#20-missing-concepts) — upsert, model_dump, MIME types, BigInteger, ondelete

---

## 1. How the Internet Works

Before reading any code, understand the fundamentals.

### HTTP — the language of the web

When your browser visits a website, it sends an **HTTP request** and gets back an **HTTP response**. Every API call is the same pattern:

```
Client (React)          Server (FastAPI)
     │                        │
     │── POST /api/v1/charts ─▶│   "I want to create a chart"
     │   Headers:              │
     │     Authorization: Bearer eyJ...
     │   Body (JSON):          │
     │     {"name": "Hung", "gender": "male", ...}
     │                        │
     │◀── HTTP 201 ────────────│   "Done, here is the chart"
     │   Body (JSON):          │
     │     {"chart_id": "abc", "chart_matrix": {...}}
```

**HTTP Methods:**
| Method | Meaning | Example |
|--------|---------|---------|
| `GET` | Read something | Get user profile |
| `POST` | Create something | Create a chart |
| `PATCH` | Update part of something | Update client name |
| `PUT` | Replace something entirely | Replace configuration |
| `DELETE` | Delete something | Delete a chart |

**HTTP Status Codes:**
| Code | Name | Meaning |
|------|------|---------|
| 200 | OK | Everything worked |
| 201 | Created | New resource created |
| 204 | No Content | Worked, nothing to return |
| 400 | Bad Request | You sent bad data |
| 401 | Unauthorized | You're not logged in |
| 403 | Forbidden | Logged in but not allowed |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation failed (Pydantic) |
| 429 | Too Many Requests | Rate limited |
| 500 | Internal Server Error | Bug on our side |

### JSON — the data format

APIs communicate using **JSON** (JavaScript Object Notation):

```json
{
  "name": "Nguyen Van A",
  "gender": "male",
  "dob_solar": "1990-01-15",
  "birth_hour": "06:00"
}
```

JSON supports: strings `"..."`, numbers `123`, booleans `true/false`, null, arrays `[...]`, objects `{...}`.

### Authentication flow

```
1. User registers → server stores hashed password in DB
2. User logs in   → server verifies password, returns JWT token
3. Every request  → user sends "Authorization: Bearer <token>" header
4. Server decodes  → token to get user_id, loads user from DB
```

---

## 2. Project Overview & Request Journey

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │ Frontend │    │  FastAPI │    │   PostgreSQL DB   │  │
│  │  (React) │◄──▶│  :8000   │◄──▶│     :5432        │  │
│  └──────────┘    └────┬─────┘    └──────────────────┘  │
│                       │                                  │
│                  ┌────▼─────┐    ┌──────────────────┐  │
│                  │  Redis   │    │  Celery Worker   │  │
│                  │  :6379   │◄──▶│  (background)    │  │
│                  └──────────┘    └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### A request's full journey

Let's trace `POST /api/v1/charts/` step by step:

```
1. main.py           → CORS middleware checks origin
2. main.py           → rate_limit dependency runs (checks Redis)
3. main.py           → router matched: charts.router
4. dependencies.py   → get_current_user() reads Bearer token → returns User object
5. schemas/chart.py  → ChartCreateRequest validates the JSON body
6. routers/charts.py → create_chart() function runs
7. services/chart_engine.py → calculates Ma_Trận_Lá_Số
8. routers/charts.py → Chart model saved to PostgreSQL
9. schemas/chart.py  → ChartResponse shapes the return value
10. FastAPI          → converts to JSON → HTTP 201
```

### Folder map

```
app/
├── main.py          ← assembles everything (start here when reading)
├── config.py        ← all settings live here
├── database.py      ← DB connection setup
├── dependencies.py  ← shared "who is this user?" logic
├── models/          ← what the DB tables look like
├── schemas/         ← what JSON the API accepts/returns
├── routers/         ← URL endpoints and their handlers
├── services/        ← real business logic (calculations, external calls)
├── core/            ← low-level: passwords, encryption, rate limits
└── tasks/           ← background scheduled jobs
```

---

## 3. config.py

**Purpose:** One central place for all configuration. No magic strings scattered across files.

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
```

- `BaseSettings` — Pydantic's class for reading environment variables.
- `lru_cache` — Python built-in that memoizes a function (caches its return value).

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
```

`model_config` tells Pydantic: "Read values from a file called `.env` in the current directory."

The `.env` file looks like:
```
DATABASE_URL=postgresql+asyncpg://tuvi:tuvi@db:5432/tuvi
SECRET_KEY=my-super-secret-key
```

Pydantic automatically reads `DATABASE_URL` from the file and assigns it to `settings.DATABASE_URL`.

```python
    # App
    APP_NAME: str = "Tử Vi API"
    DEBUG: bool = False
```

`str = "Tử Vi API"` means: type is `str`, default value is `"Tử Vi API"`. If `.env` has `APP_NAME=Something`, that overrides the default.

```python
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://tuvi:tuvi@localhost:5432/tuvi"
```

This is a **connection string** with this format:
```
postgresql+asyncpg:// user : password @ host : port / database_name
                      tuvi   tuvi       db     5432   tuvi
```
- `postgresql` — database type
- `+asyncpg` — the Python driver (async version)
- `db` — Docker service name (resolves to the db container's IP)

```python
    REDIS_URL: str = "redis://localhost:6379/0"
    # /0 means: use database number 0 (Redis has 16 databases, 0-15)
```

```python
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
```

- `SECRET_KEY` — used to sign JWT tokens. If someone knows this, they can forge tokens. **Must be a long random string in production.**
- `ALGORITHM: "HS256"` — HMAC-SHA256. The math behind JWT signing.
- `ACCESS_TOKEN_EXPIRE_MINUTES: 60` — access tokens expire after 1 hour.
- `REFRESH_TOKEN_EXPIRE_DAYS: 30` — refresh tokens last 30 days.

```python
    FIELD_ENCRYPTION_KEY: str = "change-me-32-byte-hex-key-000000"
```

AES-256 requires a 256-bit key = 32 bytes = 64 hex characters. This encrypts `dob_solar` and `birth_hour` before saving to DB.

```python
    MAX_AUDIO_SIZE: int = 50 * 1024 * 1024   # 50 MB
    MAX_PDF_SIZE: int = 10 * 1024 * 1024      # 10 MB
```

File size limits in **bytes**. `50 * 1024 * 1024`:
- `1024 bytes` = 1 KB
- `1024 KB` = 1 MB
- `50 * 1024 * 1024` = 52,428,800 bytes = 50 MB

```python
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]
```

CORS whitelist. Only these domains can make requests from a browser. `5173` is Vite's dev server port.

```python
@lru_cache
def get_settings() -> Settings:
    return Settings()
```

**Why `@lru_cache`?** Without it, every function call creates a new `Settings()` object, reading `.env` from disk each time. With it, `Settings()` is created once and the same object is returned on every subsequent call. This is a **singleton pattern**.

Usage:
```python
# In any other file:
from app.config import get_settings
settings = get_settings()
print(settings.SECRET_KEY)
```

---

## 4. database.py

**Purpose:** Creates the database connection pool and provides sessions to route handlers.

```python
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
```

SQLAlchemy has two versions:
- **sync** (old): blocks while waiting for DB
- **async** (what we use): uses `await`, handles many requests simultaneously

```python
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,     # if True: prints SQL queries to stdout
    pool_pre_ping=True,      # sends "SELECT 1" before using a connection to verify it's alive
)
```

**What is a connection pool?**

Opening a database connection is expensive (takes ~100ms). A **pool** keeps N connections open permanently and reuses them. Instead of connecting/disconnecting on every request, we borrow a connection from the pool, use it, and return it.

```
Pool (10 connections pre-opened):
  [conn1] ← request A is using this
  [conn2] ← request B is using this
  [conn3] ← available
  [conn4] ← available
  ...
```

```python
AsyncSessionLocal = async_sessionmaker(
    bind=engine,               # use our engine
    class_=AsyncSession,       # use async sessions
    expire_on_commit=False,    # after commit(), don't invalidate loaded objects
)
```

**Why `expire_on_commit=False`?** By default, after `await db.commit()`, SQLAlchemy marks all loaded objects as "expired" — accessing any attribute would trigger another DB query. With `expire_on_commit=False`, objects remain usable after commit (avoids extra queries when we return data right after saving).

```python
class Base(DeclarativeBase):
    pass
```

`Base` is the **parent class** for all models. It:
1. Keeps a registry of all table definitions.
2. Provides `__tablename__`, `metadata`, and ORM mapping magic.

Every model inherits from it:
```python
class User(Base):       # ← User is a database table
    __tablename__ = "users"
```

```python
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

**`yield` makes this a generator function.** FastAPI uses it as a dependency:

```
1. FastAPI calls get_db()
2. get_db() creates a session with AsyncSessionLocal()
3. get_db() yields the session → FastAPI injects it into the route function
4. Route function runs (uses the session)
5. Route function returns → FastAPI resumes get_db() after yield
6. `async with` block ends → session is automatically closed
```

Even if the route raises an exception, the `async with` block ensures the session is closed (no connection leaks).

---

## 5. dependencies.py

**Purpose:** Reusable logic injected into route functions via `Depends()`.

```python
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

bearer_scheme = HTTPBearer()
```

`HTTPBearer()` is a FastAPI security helper. When used as a dependency, it:
1. Reads the `Authorization` header from the request.
2. Expects format: `Authorization: Bearer eyJhbGci...`
3. Returns an `HTTPAuthorizationCredentials` object with `.credentials = "eyJhbGci..."`
4. Automatically returns HTTP 403 if the header is missing.

```python
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
```

`Depends(bearer_scheme)` means: "first run `bearer_scheme`, pass its result as `credentials`."
`Depends(get_db)` means: "first run `get_db`, pass its result as `db`."

This is **dependency injection** — the function declares what it needs, FastAPI provides it.

```python
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
```

`credentials.credentials` = the raw JWT string (e.g. `"eyJhbGci..."`).
`decode_access_token()` decodes it. Returns `None` if expired or tampered.

```python
    user_id = payload.get("sub")
    # payload is a dict like: {"sub": "abc-123", "type": "access", "exp": 1234567890}
    # "sub" = subject = user_id (JWT standard field name)
```

```python
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    # scalar_one_or_none() = return one result or None; raise error if multiple found
```

```python
def require_role(*roles: str):
```

`*roles: str` = **variadic argument** = accepts any number of strings:
```python
require_role("chuyen_gia")                    # roles = ("chuyen_gia",)
require_role("nghien_cuu", "chuyen_gia")      # roles = ("nghien_cuu", "chuyen_gia")
```

```python
    async def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return _check
```

`require_role` returns a **function** (`_check`). This is a **closure** — `_check` captures `roles` from the outer scope. When FastAPI calls `_check`, it already knows which roles are allowed.

Usage:
```python
_expert = require_role("chuyen_gia")
# _expert is now the _check function with roles=("chuyen_gia",) baked in

@router.post("/clients/")
async def create_client(current_user: User = Depends(_expert)):
    # FastAPI calls _expert(get_current_user()), checks role, returns user or 403
```

---

## 6. models/

Models define **database tables**. Each class maps to one table. SQLAlchemy translates Python operations into SQL.

### models/\_\_init\_\_.py

```python
from app.models.user import User
from app.models.chart import Chart, ChartConfiguration
from app.models.annotation import Annotation
from app.models.journal import JournalLog
from app.models.client import Client
from app.models.appointment import Appointment
from app.models.attachment import Attachment
```

**Why import all models here?** SQLAlchemy uses string references for relationships:
```python
charts: Mapped[list["Chart"]] = relationship("Chart", ...)
```

The string `"Chart"` is resolved at mapper configuration time. If `Chart` hasn't been imported yet when `User`'s mapper is configured, it raises `InvalidRequestError: 'Chart' failed to locate a name`.

By importing everything in `__init__.py` and then doing `import app.models` in `main.py`, all classes are registered in SQLAlchemy's mapper registry before any relationships are resolved.

### models/user.py

```python
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
```

**Imports explained:**
- `uuid` — Python standard library for generating UUIDs (universally unique identifiers like `"550e8400-e29b-41d4-a716-446655440000"`)
- `Boolean, DateTime, Enum, String, func` — SQLAlchemy column types
- `UUID` from `postgresql` dialect — PostgreSQL-native UUID type (stored as 16 bytes, not a string)
- `Mapped, mapped_column` — modern SQLAlchemy 2.0 syntax for defining columns with type hints
- `relationship` — defines virtual links between tables

```python
class User(Base):
    __tablename__ = "users"
```

`__tablename__` is a special SQLAlchemy attribute. It tells SQLAlchemy what to name the table in PostgreSQL. Without it, SQLAlchemy would default to the class name lowercased.

```python
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
```

Line by line:
- `Mapped[uuid.UUID]` — Python type hint; this column stores Python `uuid.UUID` objects
- `UUID(as_uuid=True)` — PostgreSQL column type; `as_uuid=True` means convert between Python's `uuid.UUID` and PostgreSQL's native UUID type automatically
- `primary_key=True` — this column is the table's primary key (must be unique, cannot be NULL, used for all foreign key references)
- `default=uuid.uuid4` — when creating a new User without specifying `user_id`, call `uuid.uuid4()` to generate one. Note: `uuid.uuid4` (no parentheses) = pass the function itself, not call it yet

```python
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
```

- `String(255)` — VARCHAR(255) in PostgreSQL. Max 255 characters.
- `unique=True` — creates a UNIQUE constraint. PostgreSQL will reject duplicate emails at the DB level.
- `nullable=False` — NOT NULL constraint. The column must always have a value.
- `index=True` — creates a B-tree index on this column. Makes `WHERE email = ?` queries fast.

**Why index emails?** Without an index, finding a user by email requires scanning every row in the table (O(n)). With a B-tree index, it's O(log n) — like searching a sorted list.

```python
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
```

`str | None` = Python Union type. This column can be NULL. OAuth users (who log in with Google/Facebook) never set a password, so this is `None` for them.

```python
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    facebook_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
```

`unique=True` with `nullable=True` means: the value must be unique **if present**. Two users can both have `google_id = NULL`, but no two users can share the same non-null google_id. This is standard SQL behaviour.

```python
    role: Mapped[str] = mapped_column(
        Enum("nguoi_dung", "nghien_cuu", "chuyen_gia", name="user_role"),
        default="nguoi_dung",
        nullable=False,
    )
```

`Enum(...)` creates a PostgreSQL ENUM type — a column that can only contain one of the listed values. PostgreSQL enforces this at the database level (can't insert "admin" by mistake).
- `name="user_role"` — the name of the ENUM type in PostgreSQL
- `default="nguoi_dung"` — new users are casual users by default

```python
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

- `DateTime(timezone=True)` — stores datetime WITH timezone (TIMESTAMPTZ in PostgreSQL)
- `server_default=func.now()` — the database sets this value automatically when a row is inserted. `func.now()` generates `DEFAULT NOW()` in SQL. This happens at the **database level**, not Python level — even if you insert from psql directly, the timestamp is set.

```python
    charts: Mapped[list["Chart"]] = relationship(
        "Chart",
        back_populates="user",
        cascade="all, delete-orphan"
    )
```

- `Mapped[list["Chart"]]` — type hint: `user.charts` returns a list of Chart objects
- `"Chart"` — string reference (resolved at mapper configuration time)
- `back_populates="user"` — Chart also has a `.user` attribute; keeping them in sync
- `cascade="all, delete-orphan"` — when a User is deleted, automatically delete all their Charts too

**`cascade="all, delete-orphan"` explained:**
- `"all"` includes: save-update, merge, expunge, delete, refresh-expire
- `"delete-orphan"` — if a Chart is removed from `user.charts` (but user isn't deleted), also delete the Chart from the DB

### models/chart.py

```python
class Chart(Base):
    __tablename__ = "charts"

    dob_solar_enc: Mapped[str] = mapped_column(Text, nullable=False)
    birth_hour_enc: Mapped[str] = mapped_column(Text, nullable=False)
```

The `_enc` suffix is a naming convention meaning "encrypted". The actual date `"1990-01-15"` is encrypted with AES-256 before being stored. Stored value looks like: `"b64:nonce+ciphertext"`.

```python
    chart_matrix: Mapped[dict] = mapped_column(JSONB, nullable=False)
```

`JSONB` = PostgreSQL's binary JSON type. It:
- Stores any JSON structure (dict, list, nested objects)
- Indexes JSON keys for fast lookup
- Is more efficient than plain JSON (binary storage)

Stored value:
```json
{
  "1": ["Tử Vi", "Thiên Cơ", "★ Cung Mệnh"],
  "2": ["Vũ Khúc"],
  "3": ["Liêm Trinh", "Thiên Phủ"],
  ...
}
```

```python
    configuration_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("chart_configurations.configuration_id", ondelete="SET NULL"),
        nullable=True
    )
```

`ondelete="SET NULL"` — if the referenced ChartConfiguration is deleted, set this column to NULL (instead of also deleting the chart). This preserves charts even if their configuration is deleted.

Compare with `ondelete="CASCADE"` — that would delete the chart too.

```python
    ai_interpretation: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ai_cached_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

The AI interpretation is cached in the chart row itself. `ai_cached_at` records when it was last fetched. When the interpretation is requested again, we check `ai_interpretation` first before calling the external AI service.

### models/annotation.py

```python
    modified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
```

`onupdate=func.now()` — every time this row is updated, PostgreSQL automatically updates `modified_at` to the current timestamp. You don't need to set it manually in code.

### models/client.py

```python
from sqlalchemy.dialects.postgresql import ARRAY

    tags: Mapped[list[str]] = mapped_column(ARRAY(String(100)), nullable=False, default=list)
```

`ARRAY(String(100))` — PostgreSQL array of strings. Stores `["tag1", "tag2", "vip"]` natively in PostgreSQL.
- `default=list` — passes the `list` **function** (not `list()`) as default. SQLAlchemy calls it to get `[]` for each new row.

**Why not a separate tags table?** For simple OR-filter lookups, PostgreSQL arrays with `&&` (overlap operator) are faster and simpler than a JOIN.

---

## 7. schemas/

Schemas serve two purposes:
1. **Input validation** — reject bad data before it reaches the database.
2. **Output shaping** — control exactly what JSON is returned (hide sensitive fields).

### schemas/auth.py

```python
from pydantic import BaseModel, EmailStr, field_validator

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
```

`EmailStr` is a special Pydantic type that validates email format. It checks:
- Has exactly one `@`
- Has a domain with a dot
- Is a valid format (but doesn't actually send a test email)

```python
    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v
```

`@field_validator("password")` — runs this method when the `password` field is being validated.
`@classmethod` — required by Pydantic for validators (method belongs to the class, not an instance).
`cls` — the class itself (like `self` but for class methods).
`v` — the value being validated.

If you `raise ValueError(...)`, Pydantic catches it and returns HTTP 422 with the message.
You **must** `return v` at the end — the return value becomes the field's value.

```python
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
```

This is a **response schema**. When a route returns `TokenResponse(access_token=..., refresh_token=...)`, FastAPI serializes it to:
```json
{"access_token": "eyJ...", "refresh_token": "eyJ...", "token_type": "bearer"}
```

```python
class UserResponse(BaseModel):
    user_id: str
    email: str
    role: str
    streak_count: int

    model_config = {"from_attributes": True}
```

`model_config = {"from_attributes": True}` — allows creating this schema from a SQLAlchemy model object:
```python
user = User(...)   # SQLAlchemy object
response = UserResponse.model_validate(user)  # works because from_attributes=True
# FastAPI does this automatically when response_model=UserResponse
```

Without this, Pydantic would expect a plain dict, not an ORM object.

### schemas/chart.py

```python
class ChartCreateRequest(BaseModel):
    name: str
    gender: str
    dob_solar: date
    birth_hour: str | None = None
    timezone_offset: float = 7.0
    configuration_id: uuid.UUID | None = None
```

- `date` — Python's `datetime.date` type. Pydantic parses `"1990-01-15"` into a `date(1990, 1, 15)` object automatically.
- `birth_hour: str | None = None` — optional (can be omitted). If omitted, defaults to `None`. The router then defaults it to `"12:00"`.
- `timezone_offset: float = 7.0` — defaults to Vietnam's UTC+7 if not specified.
- `configuration_id: uuid.UUID | None = None` — optional UUID. Pydantic parses `"abc-123-..."` into a `uuid.UUID` object.

```python
    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        if v not in ("male", "female"):
            raise ValueError("gender must be 'male' or 'female'")
        return v
```

`v not in ("male", "female")` — checks if `v` is not one of the allowed values. `("male", "female")` is a **tuple** (immutable list). `in` checks membership.

---

## 8. core/security.py

**Purpose:** Password hashing and JWT token management.

```python
_BCRYPT_ROUNDS = 12
```

`_` prefix is a Python convention meaning "private" (not meant to be imported by other modules).

bcrypt is a **password hashing algorithm**. Hashing is one-way: you can't get the password back from the hash.

**Why 12 rounds?** Each round doubles the computation time. Rounds = 12 means 2^12 = 4096 iterations. At ~100ms to hash on a modern server, it would take ~13 hours to try 500,000 passwords by brute force. Higher is more secure but slower.

```python
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode(), salt).decode()
```

**Step by step:**
1. `password.encode()` — converts `"mypassword"` (Python str) to `b"mypassword"` (bytes). bcrypt requires bytes.
2. `bcrypt.gensalt(rounds=12)` — generates random salt like `b"$2b$12$abc123..."`. The salt ensures two users with the same password get different hashes.
3. `bcrypt.hashpw(password_bytes, salt)` — combines salt + password + 4096 rounds → hash bytes like `b"$2b$12$abc123...XYZhashed"`
4. `.decode()` — converts bytes back to string for DB storage.

```python
def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())
```

`bcrypt.checkpw` extracts the salt from the stored hash, re-hashes the plain password with that same salt, then compares. You **cannot** reverse the hash — you can only verify by re-hashing.

```python
def _create_token(data: dict[str, Any], expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
```

`data.copy()` — makes a copy so we don't modify the original dict.
`payload["exp"]` — `exp` is JWT standard for "expiration time" (Unix timestamp).
`jwt.encode(payload, SECRET_KEY, algorithm="HS256")` — signs the payload with HMAC-SHA256.

**What a JWT looks like:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9   ← header (base64)
.
eyJzdWIiOiJhYmMtMTIzIiwidHlwZSI6ImFjY2VzcyIsImV4cCI6MTIzNDU2Nzg5MH0   ← payload (base64)
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c   ← signature (HMAC-SHA256)
```

The payload is NOT encrypted — anyone can base64-decode it. The **signature** prevents tampering — if you change the payload, the signature won't match.

```python
def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None
```

`jwt.decode()` — verifies the signature AND checks `exp`. If either fails, raises `JWTError`.
`if payload.get("type") != "access"` — prevents using a refresh token as an access token.
The whole thing in `try/except` — if anything goes wrong, return `None` (caller handles it).

---

## 9. core/encryption.py

**Purpose:** AES-256-GCM encryption for sensitive fields (`dob_solar`, `birth_hour`).

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
```

**AES-256-GCM** explained:
- **AES** = Advanced Encryption Standard — the most widely used symmetric cipher
- **256** = key length in bits (32 bytes). More bits = harder to brute-force.
- **GCM** = Galois/Counter Mode — provides both encryption AND authentication (detects if ciphertext was tampered with)

```python
def _get_key() -> bytes:
    key_hex = settings.FIELD_ENCRYPTION_KEY
    return bytes.fromhex(key_hex)
```

`bytes.fromhex("0a1b2c...")` converts a hex string to raw bytes.
Example: `"ff00"` → `b'\xff\x00'` (2 bytes, values 255 and 0).

```python
def encrypt_field(plaintext: str) -> str:
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
```

`os.urandom(12)` — generates 12 cryptographically random bytes. This is the **nonce** (Number Used Once). The same plaintext encrypted twice will produce different ciphertexts because each nonce is different.

**Why a random nonce?** Without it, encrypting `"1990-01-15"` always produces the same ciphertext — an attacker could see that two users have the same birthday without decrypting. With a random nonce, each encryption is unique.

```python
    ct = aesgcm.encrypt(nonce, plaintext.encode(), None)
    # None = no "additional authenticated data" (AAD)
    return base64.b64encode(nonce + ct).decode()
```

`nonce + ct` — concatenates the nonce bytes and ciphertext bytes. We store both together because we need the nonce to decrypt.

`base64.b64encode(...)` — converts binary bytes to safe ASCII string for PostgreSQL TEXT storage. Binary bytes can contain null bytes and other special characters that would corrupt text columns.

```python
def decrypt_field(ciphertext: str) -> str:
    raw = base64.b64decode(ciphertext.encode())
    nonce, ct = raw[:12], raw[12:]   # first 12 bytes = nonce, rest = ciphertext
    return aesgcm.decrypt(nonce, ct, None).decode()
```

`raw[:12]` — Python slice. Gets bytes at index 0, 1, 2, ..., 11 (12 bytes).
`raw[12:]` — gets bytes from index 12 to end.

---

## 10. core/rate_limit.py

**Purpose:** Limits each user to 100 requests per minute. Returns HTTP 429 if exceeded.

### How the sliding window works

```
Timeline: ─────────────────────────────────────────────────────▶
           t=0   t=10  t=20  t=30  t=40  t=50  t=60  t=70  t=80

Requests:  req1  req2  req3  .....  .....  .....  req4  req5  req6

At t=70, window is t=10 → t=70. req1 (t=0) is outside → removed.
At t=70, count = 4 (req2, req3, req4, req5). Under limit.
```

```python
async def rate_limit(request: Request, current_user: User = Depends(get_current_user)):
    redis: aioredis.Redis = request.app.state.redis
```

`request.app.state.redis` — accesses Redis client stored in `app.state` during lifespan startup. `request.app` = the FastAPI app instance. `.state` = a namespace where you can store anything.

```python
    key = f"rate:{current_user.user_id}"
    now = int(time.time())
    window_start = now - settings.RATE_LIMIT_WINDOW_SECONDS
```

`time.time()` returns current Unix timestamp as float (e.g., `1711843200.123`). `int(...)` truncates to whole seconds.
`key` example: `"rate:550e8400-e29b-41d4-a716-446655440000"`

```python
    pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, window_start)
    pipe.zadd(key, {str(now): now})
    pipe.zcard(key)
    pipe.expire(key, settings.RATE_LIMIT_WINDOW_SECONDS)
    results = await pipe.execute()
```

**Redis pipeline** — sends 4 commands to Redis in one network round trip. Without pipeline, each command would require a separate network call (4× slower).

**Redis sorted set commands:**
- `ZADD key score member` — adds member with a score to a sorted set. Here: adds current timestamp as both score and member.
- `ZREMRANGEBYSCORE key min max` — removes all members with scores between min and max. Removes requests older than the window.
- `ZCARD key` — counts members in the sorted set = number of requests in the current window.
- `EXPIRE key seconds` — auto-delete the key after N seconds (cleanup).

```python
    count = results[2]   # result of ZCARD (3rd command, index 2)
    if count > settings.RATE_LIMIT_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={"Retry-After": str(retry_after)},
        )
```

`headers={"Retry-After": "60"}` — tells the client how many seconds to wait before trying again. This is a standard HTTP header that browsers and API clients can read.

---

## 11. routers/

### routers/auth.py — Authentication Endpoints

```python
router = APIRouter()
```

`APIRouter()` is like a mini FastAPI app for a group of related routes. Routes are defined on the router, then registered with the main app in `main.py` via `app.include_router(...)`.

```python
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
```

- `"/register"` — relative path. Combined with prefix `"/api/v1/auth"` in `main.py` → full path is `"/api/v1/auth/register"`.
- `response_model=UserResponse` — FastAPI will validate and serialize the return value using `UserResponse`. Any extra fields not in `UserResponse` are stripped. This prevents accidentally returning sensitive data.
- `status_code=201` — the default success code for this route is 201.
- `body: RegisterRequest` — FastAPI reads the request body, parses it as JSON, validates it with `RegisterRequest`.

```python
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Registration failed")
```

**Security note:** We say "Registration failed" instead of "Email already exists". If we said the latter, an attacker could enumerate which emails are registered (useful for phishing). Vague error messages prevent this.

```python
@router.get("/google/login")
async def google_login():
    url = AuthService.google_auth_url()
    return RedirectResponse(url)
```

`RedirectResponse(url)` — returns HTTP 302 with a `Location` header. The browser automatically follows the redirect to Google's login page.

**OAuth2 flow:**
```
1. User clicks "Login with Google"
2. Frontend calls GET /auth/google/login
3. Backend returns redirect to: https://accounts.google.com/o/oauth2/auth?client_id=...&redirect_uri=...
4. User logs in on Google's page
5. Google redirects back to: GET /auth/google/callback?code=abc123
6. Backend exchanges code for user info via Google API
7. Backend creates/finds user, returns JWT tokens
```

```python
@router.delete("/me", status_code=status.HTTP_202_ACCEPTED)
async def request_account_deletion(...):
    await AuthService.queue_deletion(db, current_user)
    return {"detail": "Deletion request received. Data will be removed within 30 days."}
```

HTTP 202 = "Accepted" — the request was received but processing happens asynchronously. Deletion doesn't happen immediately (30-day requirement from Req 23).

### routers/charts.py — Chart Management

```python
@router.post("/", response_model=ChartResponse, status_code=status.HTTP_201_CREATED)
async def create_chart(body: ChartCreateRequest, ...):
    birth_hour = body.birth_hour or "12:00"
    warned = body.birth_hour is None
```

`body.birth_hour or "12:00"` — if `birth_hour` is `None` (falsy), use `"12:00"`. Python's `or` returns the first truthy value.

```python
    lunar = ChartEngine.solar_to_lunar(body.dob_solar, body.timezone_offset)
    matrix = ChartEngine.calculate(lunar, birth_hour, body.gender)
```

Pure calculation — no database involved yet. Converts date, then places 108 stars.

```python
    chart = Chart(
        user_id=current_user.user_id,
        name=body.name,
        gender=body.gender,
        dob_solar_enc=encrypt_field(str(body.dob_solar)),   # ← encrypt before saving
        birth_hour_enc=encrypt_field(birth_hour),           # ← encrypt before saving
        dob_lunar_year=lunar["year"],
        dob_lunar_month=lunar["month"],
        dob_lunar_day=lunar["day"],
        dob_lunar_leap=lunar["is_leap_month"],
        chart_matrix=matrix,
        configuration_id=body.configuration_id,
    )
    db.add(chart)      # stage the insert
    await db.commit()  # execute INSERT SQL
    await db.refresh(chart)  # reload to get auto-generated fields (chart_id, created_at)
```

`db.add(chart)` doesn't immediately execute SQL. It stages the operation. `await db.commit()` executes it (wraps in a transaction).

`await db.refresh(chart)` sends `SELECT * FROM charts WHERE chart_id = ?` to populate fields that were set by the database (like `created_at` with `server_default`).

```python
async def _get_owned_chart(db: AsyncSession, chart_id: uuid.UUID, user_id: uuid.UUID) -> Chart:
    result = await db.execute(select(Chart).where(Chart.chart_id == chart_id))
    chart = result.scalar_one_or_none()
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    if chart.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return chart
```

**Ownership check pattern** — used everywhere in the codebase. Steps:
1. Find the resource by ID.
2. If not found → 404 (don't reveal whether it belongs to someone else).
3. If found but wrong owner → 403.

**Security note:** We always check ownership. Without this, user A could read user B's charts just by guessing chart IDs.

### routers/calendar.py — Date Conversion

```python
@router.post("/solar-to-lunar")
async def solar_to_lunar(body: SolarToLunarRequest):
    result = CalendarService.solar_to_lunar(body.dob_solar, body.timezone_offset)
    return result
```

No authentication required for the calendar endpoints — they're pure utilities (no user data involved).

### routers/clients.py — CRM

```python
_expert = require_role("chuyen_gia")

@router.get("/")
async def list_clients(
    tags: list[str] | None = None,
    current_user: User = Depends(_expert),
    db: AsyncSession = Depends(get_db),
):
```

`tags: list[str] | None = None` — FastAPI reads this from **query parameters**: `GET /clients/?tags=vip&tags=premium` → `tags = ["vip", "premium"]`.

```python
    if tags:
        q = q.where(Client.tags.overlap(tags))
```

`.overlap(tags)` generates PostgreSQL's `&&` operator:
```sql
WHERE tags && ARRAY['vip', 'premium']
```
This returns clients who have **any** of the given tags (OR logic, per Req 13).

```python
@router.post("/bulk/tag")
async def bulk_tag(body: BulkTagRequest, ...):
    result = await db.execute(
        select(Client).where(
            Client.expert_id == current_user.user_id,
            Client.client_id.in_(body.client_ids),   # ← SQL IN clause
        )
    )
    clients = result.scalars().all()
    for client in clients:
        client.tags = list(set(client.tags) | set(body.tags))
        # set(a) | set(b) = union of two sets (no duplicates)
```

`Client.client_id.in_(body.client_ids)` generates `WHERE client_id IN ('id1', 'id2', ...)`.

`set(client.tags) | set(body.tags)` — union of two sets:
```python
set(["vip", "old"]) | set(["vip", "new"])
# = {"vip", "old", "new"}   (vip appears only once)
```

### routers/attachments.py — File Uploads

```python
@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    client_id: uuid.UUID = Form(...),
    appointment_id: uuid.UUID | None = Form(None),
    file: UploadFile = File(...),
    ...
):
```

`Form(...)` and `File(...)` — for multipart form uploads (not JSON). `...` means "required" in Pydantic/FastAPI.

`UploadFile` — FastAPI's async file object. Has:
- `.filename` — original filename
- `.content_type` — MIME type
- `.read()` — async method to read file contents as bytes

```python
    contents = await file.read()
    file_size = len(contents)
```

`await file.read()` — reads entire file into memory as `bytes`. `len(bytes)` = size in bytes.

```python
    max_size = settings.MAX_AUDIO_SIZE if is_audio else settings.MAX_PDF_SIZE
    if file_size > max_size:
        raise HTTPException(status_code=413, detail=f"File exceeds maximum size")
        # 413 = Payload Too Large
```

### routers/reports.py — PDF Export

```python
@router.post("/")
async def generate_report(body: ReportRequest, ...):
    pdf_bytes = generate_pdf(...)

    report_id = str(uuid.uuid4())
    pdf_path = REPORTS_DIR / f"{report_id}.pdf"
    pdf_path.write_bytes(pdf_bytes)
```

`REPORTS_DIR / f"{report_id}.pdf"` — Python's `pathlib.Path` supports `/` operator for path joining:
```python
Path("/tmp/tuvi_reports") / "abc-123.pdf"
# = Path("/tmp/tuvi_reports/abc-123.pdf")
```

`pdf_path.write_bytes(pdf_bytes)` — writes binary data to a file.

```python
    token = create_download_token(report_id)
    return {"download_url": f"/api/v1/reports/download/{token}", "expires_in_hours": 24}
```

The token embeds `report_id + timestamp + HMAC signature`. Only our server can create valid tokens (requires `SECRET_KEY`). Anyone with the URL can download the file, but only for 24 hours.

---

## 12. services/

### services/auth_service.py

```python
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
```

**OAuth2 code exchange explained:**
1. Google gives us a one-time `code` after user approves.
2. We exchange it for an `access_token` by making a server-to-server POST to Google.
3. We use the `access_token` to call Google's userinfo API.
4. We get the user's email and Google ID.

Why exchange instead of using the code directly? The code is short-lived (minutes) and single-use. By exchanging it server-side with our `client_secret`, we prove we're the legitimate app (not someone who intercepted the code).

```python
    result = await db.execute(select(User).where(User.google_id == info["sub"]))
    user = result.scalar_one_or_none()

    if not user:
        result2 = await db.execute(select(User).where(User.email == info["email"]))
        user = result2.scalar_one_or_none()

    if user:
        user.google_id = info["sub"]   # link Google account to existing email account
    else:
        user = User(email=info["email"], google_id=info["sub"])   # new user
        db.add(user)
```

**Account linking logic:**
1. First check if a user with this google_id exists (returning user).
2. If not, check by email (user registered with password, now logging in with Google).
3. If found by email → link their Google ID to the existing account.
4. If not found at all → create new account.

### services/calendar_service.py

The core algorithm converts between Gregorian and Vietnamese lunar dates using **Julian Day Numbers**.

```python
def _solar_to_jd(dd: int, mm: int, yy: int) -> int:
    """Convert Gregorian date to Julian Day Number."""
    if mm <= 2:
        yy -= 1
        mm += 12
    a = yy // 100
    b = 2 - a + a // 4
    return int(365.25 * (yy + 4716)) + int(30.6001 * (mm + 1)) + dd + b - 1524
```

**Julian Day Number (JDN)** = a continuous count of days since January 1, 4713 BC. Useful because it eliminates calendar complexities (months with different lengths, leap years) — every date becomes a single integer.

`//` = integer division (floor division): `7 // 2 = 3`, not `3.5`.

```python
def _new_moon(k: int) -> float:
    """Julian day of the k-th new moon since epoch."""
    T = k / 1236.85   # Julian centuries
    ...
```

This implements an astronomical algorithm to find the exact moment of new moons. The Vietnamese lunar calendar starts each month at the new moon in the UTC+7 timezone. Finding month boundaries requires finding new moon times.

```python
def _jd_to_lunar(jd: int, tz: float) -> dict:
    k = int((jd - 2415021.076998695) / 29.530588853)
    # 29.530588853 = mean synodic month (average time between new moons) in days
```

`2415021.076998695` = Julian Day Number of a known reference new moon. Dividing by the month length gives approximately which lunar month we're in.

### services/chart_engine.py

```python
_TU_VI_START = {0: 2, 1: 2, 2: 4, 3: 4, 4: 6, 5: 6, 6: 8, 7: 8, 8: 10}
```

A lookup table mapping the lunar day group (0-8) to the starting house of Tử Vi (the king star).

```python
def _hour_to_chi_index(birth_hour: str) -> int:
    h, _ = map(int, birth_hour.split(":"))
    # "06:00".split(":") = ["06", "00"]
    # map(int, ["06", "00"]) = [6, 0]
    # h, _ = 6, 0  (underscore = "I don't need this value")
```

`map(func, iterable)` applies `func` to every item in `iterable` and returns a lazy iterator.
`h, _` = tuple unpacking. `_` is convention for "discard this value."

```python
def _place_chinh_tinh(lunar_day: int) -> dict[int, list[str]]:
    group = (lunar_day - 1) % 9
    # % = modulo: remainder after division
    # (15 - 1) % 9 = 14 % 9 = 5
    tu_vi_house = _TU_VI_START.get(group, 0)

    placement: dict[int, list[str]] = {i: [] for i in range(12)}
    for i, star in enumerate(_CHINH_TINH):
        # enumerate(list) = [(0, "Tử Vi"), (1, "Thiên Cơ"), ...]
        house = (tu_vi_house + _CHINH_TINH_OFFSETS[i]) % 12
        placement[house].append(star)
    return placement
```

`enumerate(iterable)` = pairs each item with its index:
```python
list(enumerate(["a", "b", "c"]))
# = [(0, "a"), (1, "b"), (2, "c")]
```

`(tu_vi_house + offset) % 12` — ensures the house number wraps around: house 14 → house 2 (14 % 12 = 2). The 12 houses form a cycle.

```python
@staticmethod
def compare(matrix_a: dict, matrix_b: dict, view: str = "side_by_side") -> dict:
    if view == "merged":
        for k in sorted(all_keys):
            merged[k] = {
                "shared": list(set(matrix_a.get(k, [])) & set(matrix_b.get(k, []))),
                # set intersection: stars present in BOTH charts at house k
            }
```

`set(a) & set(b)` = intersection (items in both):
```python
set(["Tử Vi", "Thiên Cơ"]) & set(["Tử Vi", "Vũ Khúc"])
# = {"Tử Vi"}   (only the star in both)
```

### services/ai_service.py

```python
_VI_CHARS = set("àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỷỹỵ")

def _is_vietnamese(text: str) -> bool:
    return any(c in _VI_CHARS for c in text.lower())
```

`set("àáâ...")` = creates a set of individual characters.
`any(condition for item in iterable)` = returns `True` if at least one item satisfies the condition. Short-circuits (stops at first `True`).

```python
async def interpret(chart_matrix: dict) -> dict:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(settings.AI_SERVICE_URL, json=payload, ...)
            resp.raise_for_status()   # raises exception for 4xx/5xx responses
            result = resp.json()
    except (httpx.HTTPError, Exception):
        return _fallback_interpretation(chart_matrix, menh_house)
        # graceful degradation: return stub instead of crashing
```

`timeout=30.0` — if the AI service doesn't respond within 30 seconds, raise `httpx.TimeoutException`.
`resp.raise_for_status()` — raises `httpx.HTTPStatusError` if status code is 4xx or 5xx.

### services/report_service.py

```python
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
```

ReportLab is a PDF generation library. `platypus` (Page Layout and Typography Using Scripts) is its high-level layout engine using **flowables** (objects that flow onto pages).

```python
def generate_pdf(client_name: str, ...) -> bytes:
    buf = io.BytesIO()
    # BytesIO = an in-memory bytes buffer (acts like a file, but lives in RAM)

    doc = SimpleDocTemplate(buf, pagesize=A4, ...)
    story = []   # list of flowables to render
```

Instead of writing to a file on disk, we write to a `BytesIO` buffer. This keeps the PDF in memory until we decide where to store it.

```python
    story.append(Paragraph("LÁ SỐ TỬ VI", title_style))
    story.append(Spacer(1, 0.3 * cm))   # add 0.3cm of vertical space
    story.append(grid)                   # add the 4×4 palace table
```

`story` is just a list. `doc.build(story)` renders all flowables onto PDF pages, handling page breaks automatically.

```python
def create_download_token(report_id: str) -> str:
    ts = int(time.time())
    msg = f"{report_id}:{ts}".encode()
    sig = hmac.new(settings.SECRET_KEY.encode(), msg, hashlib.sha256).hexdigest()
    return f"{report_id}:{ts}:{sig}"
```

**HMAC** (Hash-based Message Authentication Code) — a way to sign a message with a secret key.

Steps:
1. `msg = "report-uuid:1711843200"` — what we're signing
2. `hmac.new(SECRET_KEY, msg, sha256)` — signs msg with SECRET_KEY using SHA-256
3. `.hexdigest()` — converts signature to hex string like `"a3f2b1..."`
4. Token = `"report-uuid:1711843200:a3f2b1..."`

To verify:
1. Split token → extract report_id, ts, sig
2. Check `time.time() - ts < 24 * 3600` (not expired)
3. Re-compute expected sig from report_id + ts + SECRET_KEY
4. `hmac.compare_digest(sig, expected)` — timing-safe comparison

**Why `hmac.compare_digest` instead of `==`?** Regular string comparison short-circuits (stops at first mismatch). An attacker can measure response time to guess characters of the signature. `compare_digest` always takes the same time regardless of where the strings differ.

### services/notification_service.py

```python
@staticmethod
def generate_meeting_link() -> str:
    token = secrets.token_urlsafe(16)
    # secrets module = cryptographically secure random (unlike random module)
    # token_urlsafe(16) = 16 random bytes → base64url → ~22 character string
    return f"https://meet.tuvi.app/{token}"
```

`secrets.token_urlsafe()` is from Python's `secrets` module, which uses the OS's CSPRNG (Cryptographically Secure Pseudo-Random Number Generator). Never use `random.random()` for security tokens — it's predictable.

```python
def _calculate_luu_sao(today) -> dict:
    year_chi = today.year % 12
    return {
        "Lưu Thái Tuế": year_chi + 1,
        "Lưu Thiên Mã": (year_chi + 3) % 12 + 1,
        "Lưu Lộc Tồn": (year_chi + 6) % 12 + 1,
        ...
    }
```

Lưu Sao positions are **deterministic** — they depend only on the current year (via earthly branch). Same year always produces the same positions. `% 12` wraps the house number to 1-12.

---

## 13. tasks/

### tasks/celery_app.py

```python
celery_app = Celery(
    "tuvi",                          # app name (shows in logs)
    broker=settings.REDIS_URL,       # where to send task messages
    backend=settings.REDIS_URL,      # where to store task results
    include=["app.tasks.jobs"],      # modules containing task functions
)
```

**How Celery works:**

```
Beat (timer)          Broker (Redis)           Worker (processor)
─────────────         ──────────────           ──────────────────
"It's 00:05"    →    Queue: ["recalculate"]  →  picks up task
                                                 runs recalculate_luu_sao_all_users()
                                                 stores result in backend
```

```python
celery_app.conf.beat_schedule = {
    "daily-luu-sao-recalculation": {
        "task": "app.tasks.jobs.recalculate_luu_sao_all_users",
        "schedule": crontab(hour=0, minute=5),
        # crontab(hour=0, minute=5) = "at 00:05 every day"
        # like a Linux cron: "5 0 * * *"
    },
    "appointment-reminder-check": {
        "task": "app.tasks.jobs.send_appointment_reminders",
        "schedule": crontab(),   # crontab() with no args = every minute
    },
}
```

**crontab syntax:**
```
crontab(minute=0, hour=0, day_of_week="*", day_of_month="*", month_of_year="*")
```
Omitted fields default to `"*"` (every). So `crontab(hour=0, minute=5)` = "at minute 5 of hour 0, every day."

### tasks/jobs.py

```python
def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)
```

**The async/sync bridge problem:**

Celery tasks are **synchronous** functions. Our database code is **asynchronous** (`async def`). You can't call `await db.execute(...)` from a sync function.

Solution: Use `asyncio.get_event_loop().run_until_complete(coroutine)` — this runs an async coroutine synchronously by blocking until it completes.

```python
@celery_app.task(name="app.tasks.jobs.recalculate_luu_sao_all_users", bind=True, max_retries=3)
def recalculate_luu_sao_all_users(self):
```

- `@celery_app.task` — registers this function as a Celery task
- `name="..."` — explicit task name (used in beat_schedule to reference it)
- `bind=True` — gives the function access to `self` (the task instance) for calling `self.retry()`
- `max_retries=3` — if the task raises an exception, retry up to 3 times

```python
    try:
        count = _run(_inner())
        return {"recalculated": count}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * 5)
        # countdown=300 = wait 300 seconds before retrying
```

`self.retry(exc=exc, countdown=300)` — this raises a special `Retry` exception that tells Celery: "reschedule this task after 300 seconds." The original `exc` is stored for logging.

---

## 14. main.py

**Purpose:** The entry point. Creates the FastAPI app and wires everything together.

```python
import app.models  # noqa: F401
```

`# noqa: F401` — tells linters (flake8, ruff) to ignore the "imported but unused" warning. We import `app.models` purely for its **side effect** of registering all models in SQLAlchemy's mapper registry.

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,   # Redis returns strings, not bytes
    )
    yield
    await app.state.redis.aclose()
```

**`@asynccontextmanager`** converts a generator function into an async context manager:
- Code before `yield` = startup
- Code after `yield` = shutdown
- FastAPI calls this once when the server starts and once when it stops

`app.state` = a `State` object (like an empty class instance) where you can attach anything:
```python
app.state.redis = redis_client   # set
# in rate_limit.py:
request.app.state.redis          # get
```

```python
app = FastAPI(
    title=settings.APP_NAME,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)
```

- `docs_url="/api/docs"` — Swagger UI interactive documentation
- `redoc_url="/api/redoc"` — ReDoc alternative documentation view
- `openapi_url="/api/openapi.json"` — machine-readable API spec (used by Postman, code generators)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,   # allow cookies/auth headers cross-origin
    allow_methods=["*"],      # allow all HTTP methods
    allow_headers=["*"],      # allow all headers
)
```

**CORS (Cross-Origin Resource Sharing):**

Browsers block JavaScript from calling APIs on a different domain by default (security policy). CORS headers tell the browser "this server allows requests from these origins."

Without CORS middleware, when `http://localhost:5173` (React) calls `http://localhost:8000` (FastAPI), the browser blocks it.

```python
_rate_limited = [Depends(rate_limit)]

app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["Auth"])
app.include_router(charts.router, prefix=f"{API_PREFIX}/charts", dependencies=_rate_limited)
```

- `auth.router` has no `dependencies=_rate_limited` — login/register shouldn't be rate-limited per-user (the user isn't authenticated yet).
- All other routers get rate limiting applied globally to every route in them.

```python
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
```

The health endpoint is deliberately simple — no DB, no Redis, no auth. It just confirms the server process is alive. Used by Docker's healthcheck.

---

## 15. Infrastructure Files

### docker-compose.yml

```yaml
services:
  db:
    image: postgres:16-alpine
    # alpine = minimal Linux image (~5MB vs ~300MB full)
    environment:
      POSTGRES_USER: tuvi
      POSTGRES_PASSWORD: tuvi
      POSTGRES_DB: tuvi
    volumes:
      - postgres_data:/var/lib/postgresql/data
      # Named volume: data persists between container restarts
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tuvi"]
      # pg_isready: PostgreSQL's built-in connection checker
      interval: 5s     # check every 5 seconds
      timeout: 5s      # fail if no response in 5 seconds
      retries: 5       # mark unhealthy after 5 consecutive failures
```

```yaml
  api:
    build: .
    # build the Dockerfile in the current directory (backend/)
    ports:
      - "8000:8000"
      # "host_port:container_port"
      # Traffic to localhost:8000 → container's port 8000
    env_file: .env
    # Load environment variables from .env file into the container
    volumes:
      - .:/app
      # Mount local backend/ directory into /app inside container
      # Changes on your Mac are instantly visible inside Docker
    depends_on:
      db:
        condition: service_healthy  # wait for db healthcheck to pass
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "python3", "-c",
             "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      # urlopen raises HTTPError for non-2xx → exits with 1 → unhealthy
      start_period: 30s   # don't count failures during first 30s (gives app time to start)
```

```yaml
  worker:
    depends_on:
      api:
        condition: service_healthy
    # Worker waits for API (= migrations done) before starting
    # If worker starts before migrations, it crashes querying non-existent tables
    command: celery -A app.tasks.celery_app worker --loglevel=info --concurrency=2
    # -A app.tasks.celery_app = the Celery app module
    # --concurrency=2 = run 2 worker processes in parallel
```

### start.sh

```bash
#!/bin/sh
set -e
# #!/bin/sh = shebang: use /bin/sh to execute this script
# set -e = "exit immediately if any command fails"
# Without set -e, the script would continue even after errors

REVISION_COUNT=$(alembic history 2>/dev/null | wc -l | tr -d ' ')
# $(...) = command substitution: run command, capture stdout
# alembic history = lists all migration files
# 2>/dev/null = redirect stderr to /dev/null (suppress errors)
# wc -l = count lines
# tr -d ' ' = delete spaces (wc -l adds padding on macOS)

if [ "$REVISION_COUNT" -eq "0" ]; then
  alembic revision --autogenerate -m "init"
  # --autogenerate: compare models vs DB, generate SQL to make them match
  # -m "init": migration message (like a git commit message)
fi

alembic upgrade head
# head = latest migration version
# applies all pending migrations in order

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
# exec = replace this shell process with uvicorn
# (so Docker sees uvicorn as PID 1, not shell — better signal handling)
# app.main:app = "in module app.main, find the variable named app"
# --host 0.0.0.0 = listen on ALL network interfaces
#   (0.0.0.0 is Docker-speak for "accessible from outside the container")
#   (127.0.0.1 would only be accessible from inside the container)
```

### Dockerfile

```dockerfile
FROM python:3.12-slim
# Start from official Python 3.12 image (slim = no extra packages, smaller)

WORKDIR /app
# Set working directory inside container. All subsequent commands run from /app.

COPY requirements.txt .
# Copy ONLY requirements.txt first (before the rest of the code)
# Docker caches each layer. If requirements.txt doesn't change,
# Docker reuses the cached pip install layer (faster rebuilds).

RUN pip install --no-cache-dir -r requirements.txt
# --no-cache-dir = don't cache downloads (reduces image size)

COPY . .
# Copy everything else. This layer changes often (code changes)
# but pip install (above) is cached separately.

CMD ["sh", "start.sh"]
# Default command when container starts.
# ["sh", "start.sh"] uses exec form (no shell wrapping).
```

**Why copy requirements.txt before the rest of the code?**
Docker builds images in layers. Each `COPY` and `RUN` creates a new layer. If you change `app/main.py`, Docker only rebuilds from the `COPY . .` layer onward — it reuses the cached `pip install` layer. Without this split, any code change would trigger a full pip reinstall.

---

## 16. Python Concepts Glossary

### async / await

Python executes code line by line. When it hits an I/O operation (database query, HTTP call), it normally **blocks** — nothing else can happen until the operation completes.

With `async`/`await`, Python can **pause** at an `await` and process other requests while waiting:

```python
# SYNC (blocking):
def get_user(id):
    result = db.query(User).filter_by(id=id).first()  # blocks for 5ms
    return result  # during those 5ms, no other request can run

# ASYNC (non-blocking):
async def get_user(id):
    result = await db.execute(select(User).where(User.id == id))  # pauses here
    return result  # other requests can run during those 5ms
```

### Type hints

```python
name: str          # must be a string
age: int           # must be an integer
active: bool       # must be True or False
tags: list[str]    # list of strings
data: dict[str, int]  # dict mapping str keys to int values
user: User | None  # either a User object or None
```

Python doesn't enforce these at runtime (they're hints), but FastAPI and Pydantic do use them for validation.

### Decorators (@)

A decorator wraps a function to add behaviour:
```python
@router.get("/users")
async def list_users():
    ...

# Equivalent to:
async def list_users():
    ...
list_users = router.get("/users")(list_users)
# router.get("/users") returns a decorator function
# that decorator takes list_users and registers it as a route handler
```

### Comprehensions

```python
# List comprehension
squares = [x ** 2 for x in range(5)]     # [0, 1, 4, 9, 16]

# Dict comprehension
houses = {str(i + 1): [] for i in range(12)}   # {"1": [], "2": [], ..., "12": []}

# With condition
evens = [x for x in range(10) if x % 2 == 0]  # [0, 2, 4, 6, 8]
```

### `*args` and `**kwargs`

```python
def func(*args):
    # args is a tuple of all positional arguments
    print(args)

func(1, 2, 3)   # args = (1, 2, 3)

def func(**kwargs):
    # kwargs is a dict of all keyword arguments
    print(kwargs)

func(name="Hung", age=25)   # kwargs = {"name": "Hung", "age": 25}
```

In `require_role(*roles)`, `roles` captures all role strings passed: `require_role("a", "b")` → `roles = ("a", "b")`.

### `with` statement

```python
with open("file.txt") as f:
    content = f.read()
# file is automatically closed here, even if an exception occurred
```

`async with` = same thing but for async resources:
```python
async with AsyncSessionLocal() as session:
    await session.execute(...)
# session is automatically closed here
```

### f-strings

```python
name = "Hung"
age = 25
message = f"Hello {name}, you are {age} years old"
# = "Hello Hung, you are 25 years old"

# Expressions inside {}:
result = f"2 + 2 = {2 + 2}"   # = "2 + 2 = 4"
```

### `None` and truthiness

```python
x = None
if x:           # False (None is falsy)
    ...

x = ""
if x:           # False (empty string is falsy)
    ...

x = 0
if x:           # False (zero is falsy)
    ...

# Truthy: any non-empty string, any non-zero number, any non-empty list/dict

birth_hour = body.birth_hour or "12:00"
# If body.birth_hour is None (falsy), use "12:00"
```

### `result.scalars().all()` vs `result.scalar_one_or_none()`

```python
# Multiple results expected:
result = await db.execute(select(User))
users = result.scalars().all()   # returns a list: [User(...), User(...), ...]

# Zero or one result expected:
result = await db.execute(select(User).where(User.email == "x@x.com"))
user = result.scalar_one_or_none()
# Returns: User(...) if found, None if not found
# Raises: exception if more than one found (email should be unique)
```

---

*End of core documentation. Sections below cover the remaining files not yet detailed above.*

---

## 17. Remaining Models

### models/appointment.py

An appointment is a scheduled meeting between an expert (Chuyên_Gia) and a client.

```python
class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```
Same UUID primary key pattern as every other model. Each appointment gets a unique ID.

```python
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.client_id", ondelete="CASCADE"), nullable=False, index=True
    )
```
- `ForeignKey("clients.client_id", ondelete="CASCADE")` — if the client is deleted, all their appointments are automatically deleted too ("cascade").
- `index=True` — the database creates an index on this column so queries like "find all appointments for client X" are fast.

```python
    status: Mapped[str] = mapped_column(
        Enum("pending", "confirmed", "cancelled", name="appointment_status"),
        default="pending",
        nullable=False,
    )
```
`Enum(...)` restricts the column to only allow `"pending"`, `"confirmed"`, or `"cancelled"`. PostgreSQL enforces this at the database level — you literally cannot insert any other value. `name="appointment_status"` is the PostgreSQL type name.

```python
    payment_status: Mapped[str] = mapped_column(
        Enum("unpaid", "paid", "refunded", name="payment_status"),
        default="unpaid",
        nullable=False,
    )
```
Tracks whether the client has paid. Starts as `"unpaid"` by default.

```python
    meeting_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
```
The video call URL (e.g., a Zoom/Meet link). Optional — `nullable=True` means it can be empty.

```python
    client: Mapped["Client"] = relationship("Client", back_populates="appointments")
    expert: Mapped["User"] = relationship("User", foreign_keys=[expert_id])
    attachments: Mapped[list["Attachment"]] = relationship("Attachment", back_populates="appointment")
```
These three `relationship()` calls let you navigate between tables in Python:
- `appointment.client` → gives you the `Client` object
- `appointment.expert` → gives you the `User` (expert) object
- `appointment.attachments` → gives you a list of files attached to this appointment

---

### models/attachment.py

A file (audio recording or PDF note) linked to a client and optionally to a specific appointment.

```python
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/wav", "audio/mp4"}
ALLOWED_PDF_TYPE = "application/pdf"
```
Constants (fixed values) defined at the module level. These are imported and used by the attachments router to validate uploaded files. A `set` (`{...}`) is used for `ALLOWED_AUDIO_TYPES` because checking `"audio/mpeg" in ALLOWED_AUDIO_TYPES` is O(1) (instant) for sets.

```python
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)    # bytes
```
`BigInteger` holds numbers up to ~9 quintillion. A regular `Integer` only goes to ~2 billion, which is only ~2 GB. `BigInteger` safely handles any file size.

```python
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("appointments.appointment_id", ondelete="SET NULL"), nullable=True
    )
```
`ondelete="SET NULL"` — if the linked appointment is deleted, `appointment_id` becomes `NULL` instead of deleting the file. This preserves the file even if the appointment is gone.

---

### models/journal.py

A daily personal log entry. Each user gets one entry per calendar day.

```python
    log_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
```
`date` (not `datetime`) stores just the calendar date: `2024-03-15`. No time component needed — we only care which day the entry is for.

```python
    luu_sao_positions: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
```
Stores the Lưu_Sao (moving stars) for that day as JSON, e.g.:
```json
{"luu_thai_tue": 3, "luu_thien_ma": 7, "luu_loc_ton": 11}
```
`default=dict` means new rows start with `{}` (empty dict). SQLAlchemy calls `dict()` for each new row — that's why we pass the function `dict`, not `dict()`.

---

## 18. Remaining Schemas

### schemas/annotation.py

Annotations are user notes attached to a specific chart, optionally referencing a house number or star.

```python
class AnnotationCreateRequest(BaseModel):
    chart_id: uuid.UUID
    house_number: int | None = None
    star_name: str | None = None
    content: str
```
- `chart_id` is required (no default) — you must specify which chart you're annotating.
- `house_number` and `star_name` are optional (`None = None`). You can annotate a whole chart, a specific house, a specific star, or a star within a specific house.
- `content` is required — the note text.

```python
class AnnotationResponse(BaseModel):
    ...
    modified_at: datetime   # tracked automatically by the model

    model_config = {"from_attributes": True}
```
The response always includes `modified_at` so the frontend can show when a note was last edited.

---

### schemas/appointment.py

```python
class AppointmentCreateRequest(BaseModel):
    client_id: uuid.UUID
    scheduled_at: datetime
    notes: str | None = None
```
Only the expert sends this. The `client_id` must belong to that expert (checked in the router). No `meeting_link` field — the server generates the link automatically.

```python
class AppointmentUpdateRequest(BaseModel):
    scheduled_at: datetime | None = None
    status: str | None = None         # "pending" | "confirmed" | "cancelled"
    payment_status: str | None = None
    notes: str | None = None
```
All fields optional. The expert can update any combination: just reschedule, just change status, etc. Fields not included stay unchanged (via `model_dump(exclude_none=True)` in the router).

---

### schemas/journal.py

```python
class JournalLogCreate(BaseModel):
    log_date: date
    content: str | None = None
```
`date` (from Python's `datetime` module) is `YYYY-MM-DD`. Pydantic automatically parses `"2024-03-15"` from JSON into a Python `date` object.

```python
class JournalLogResponse(BaseModel):
    ...
    luu_sao_positions: dict[str, Any]
```
`dict[str, Any]` means a dictionary whose keys are strings and values can be anything (`Any` from `typing`). This mirrors the JSONB field in the database.

---

### schemas/client.py

```python
class BulkTagRequest(BaseModel):
    client_ids: list[uuid.UUID]
    tags: list[str]
```
Allows an expert to tag many clients at once. For example: `{"client_ids": ["uuid1", "uuid2"], "tags": ["vip", "long-term"]}`.

```python
class BulkExportRequest(BaseModel):
    client_ids: list[uuid.UUID]
    format: str = "csv"   # "csv" | "json"
```
Export multiple clients' data. `format` defaults to `"csv"` if not specified.

---

## 19. Remaining Routers

### routers/annotations.py

Full CRUD (Create, Read, Update, Delete) for annotations.

**Pattern: ownership check helper**

```python
async def _get_owned_annotation(db: AsyncSession, annotation_id: uuid.UUID, user_id: uuid.UUID) -> Annotation:
    result = await db.execute(select(Annotation).where(Annotation.annotation_id == annotation_id))
    annotation = result.scalar_one_or_none()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    if annotation.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return annotation
```
This helper is used by PATCH and DELETE. It:
1. Queries the database for the annotation by ID.
2. Returns 404 if it doesn't exist.
3. Returns 403 if it exists but belongs to someone else.
4. Returns the annotation object if everything is OK.

This pattern (404 → 403 → return object) is used throughout the codebase and is a security best practice. Notice we return 404 even when the record exists but belongs to someone else — this prevents an attacker from discovering which annotation IDs exist.

**List with optional filter:**

```python
@router.get("/", response_model=list[AnnotationResponse])
async def list_annotations(
    chart_id: uuid.UUID | None = None,   # ← query parameter, optional
    ...
):
    q = select(Annotation).where(Annotation.user_id == current_user.user_id)
    if chart_id:
        q = q.where(Annotation.chart_id == chart_id)
```
`chart_id: uuid.UUID | None = None` in the function signature becomes a URL query parameter: `GET /annotations/?chart_id=some-uuid`. If not provided, returns all annotations. If provided, filters to that chart.

---

### routers/appointments.py

Only `chuyen_gia` (expert) users can access these endpoints.

```python
_expert = require_role("chuyen_gia")
```
`require_role("chuyen_gia")` returns a FastAPI dependency function. Storing it in `_expert` avoids repeating the string `"chuyen_gia"` everywhere.

**Auto-generating meeting links:**

```python
meeting_link = NotificationService.generate_meeting_link()
appt = Appointment(
    ...
    meeting_link=meeting_link,
)
```
The server creates the meeting link at appointment creation time. The expert never manually enters a URL.

**Scheduling the reminder:**

```python
await NotificationService.schedule_reminder(appt)
```
After saving the appointment, this queues a background task that will fire 15 minutes before `scheduled_at`. The user doesn't wait for this — the `await` completes quickly because it just writes to Redis/database, not sends the actual notification.

**Ownership check:**
```python
async def _get_owned_appointment(db, appt_id, expert_id):
    ...
    if appt.expert_id != expert_id:
        raise HTTPException(status_code=403, detail="Forbidden")
```
An expert can only modify their own appointments.

---

### routers/journal.py

Daily journal logs with automatic Lưu_Sao position calculation.

**Upsert pattern:**

```python
result = await db.execute(
    select(JournalLog).where(
        JournalLog.user_id == current_user.user_id,
        JournalLog.log_date == body.log_date,
    )
)
log = result.scalar_one_or_none()

luu_sao = _calculate_luu_sao(body.log_date)

if log:
    log.content = body.content       # update existing
    log.luu_sao_positions = luu_sao
else:
    log = JournalLog(...)            # create new
    db.add(log)
```
"Upsert" = "update if exists, insert if not." The user can call `POST /journal/` multiple times for the same date — it will update the existing log rather than creating duplicates. This way there is always exactly one log per user per day.

**Why recalculate Lưu_Sao on every upsert?** The positions are deterministic for a given date. Recalculating ensures the stored data is always fresh even if the calculation logic changes.

**Date as URL path parameter:**

```python
@router.get("/{log_date}", response_model=JournalLogResponse)
async def get_log(
    log_date: date,   # FastAPI parses "2024-03-15" from the URL automatically
    ...
):
```
`GET /journal/2024-03-15` retrieves the log for that specific date. FastAPI knows to parse the URL segment `"2024-03-15"` as a Python `date` object because of the `date` type hint.

---

### routers/ai_interpretation.py

Generates AI interpretation for a chart with cache-first logic.

```python
@router.post("/{chart_id}/interpret")
async def interpret_chart(...):
    ...
    # Serve from cache if available
    if chart.ai_interpretation:
        return {"interpretation": chart.ai_interpretation, "cached": True}

    interpretation = await AIService.interpret(chart.chart_matrix)

    chart.ai_interpretation = interpretation
    chart.ai_cached_at = datetime.utcnow()
    await db.commit()

    return {"interpretation": interpretation, "cached": False}
```

**Cache-first strategy (explained step by step):**

1. Look up the chart in the database.
2. If `ai_interpretation` is already stored (not null/empty) → return it immediately without calling the AI. This is free and instant.
3. If no cache → call the external AI API (costs money and takes time).
4. Save the AI's response into `chart.ai_interpretation`.
5. Return the response along with `"cached": False` so the frontend knows it was freshly generated.

The `"cached": True/False` field is informational — useful for debugging and analytics.

---

### routers/notifications.py

User notification preferences and manual Lưu_Sao recalculation trigger.

```python
@router.put("/preferences")
async def update_preferences(
    notify_channel: str,   # ← query parameter (not a request body)
    ...
):
    if notify_channel not in ("email", "push", "both"):
        raise HTTPException(status_code=400, detail="Invalid channel")
    current_user.notify_channel = notify_channel
    await db.commit()
```

Notice `notify_channel: str` is a **query parameter** here, not a Pydantic model. The request looks like: `PUT /notifications/preferences?notify_channel=email`. This is fine for a single simple field.

The validation `if notify_channel not in (...)` is manual here. In more complex schemas, Pydantic validators would handle this automatically. Both approaches are valid.

```python
@router.post("/luu-sao/recalculate")
async def trigger_luu_sao_recalculation(...):
    result = await NotificationService.recalculate_luu_sao(db, current_user.user_id)
    return result
```
Allows a single user to manually trigger their Lưu_Sao recalculation (usually done automatically at midnight by the Celery beat task). Useful for testing or "refresh" buttons in the UI.

---

## 20. Missing Concepts

### What is an "upsert"?

An upsert is a database operation that means: "insert a new row if it doesn't exist, or update the existing row if it does."

The journal router implements upsert manually:
1. Query for an existing row.
2. If found: modify it.
3. If not found: create a new one.

PostgreSQL has a native `INSERT ... ON CONFLICT DO UPDATE` syntax for this, but the manual approach used here is equally correct and easier to read.

### What does `model_dump(exclude_none=True)` do?

```python
for field, value in body.model_dump(exclude_none=True).items():
    setattr(annotation, field, value)
```

`body.model_dump()` converts the Pydantic model to a plain Python dictionary. For example:
```python
AnnotationUpdateRequest(content="new text", house_number=None)
# .model_dump() → {"content": "new text", "house_number": None}
# .model_dump(exclude_none=True) → {"content": "new text"}
```

`exclude_none=True` drops any field that is `None`. This is the key to partial updates:
- The user only sends the fields they want to change.
- We only update those fields on the database row.
- Fields not in the request stay unchanged.

`setattr(annotation, field, value)` is Python's way to set an attribute by name dynamically. It's equivalent to `annotation.content = "new text"` but works when the field name is a variable (not known at write time).

### What is a MIME type?

A MIME type (Multipurpose Internet Mail Extensions) identifies file formats. Examples:
- `"audio/mpeg"` — MP3 audio
- `"audio/wav"` — WAV audio
- `"audio/mp4"` — M4A audio (Apple's format)
- `"application/pdf"` — PDF document
- `"image/jpeg"` — JPEG image
- `"text/plain"` — plain text

When a file is uploaded, the browser sends the MIME type in the HTTP request. The router checks `upload.content_type` against `ALLOWED_AUDIO_TYPES` to reject unexpected file formats.

### What is `BigInteger` vs `Integer`?

In PostgreSQL (and most databases):
| Type | Max value | Bytes |
|------|-----------|-------|
| `Integer` | ~2.1 billion | 4 |
| `BigInteger` | ~9.2 quintillion | 8 |

A 50 MB audio file = 52,428,800 bytes. That fits in `Integer`. But future files might be larger. `BigInteger` costs only 4 extra bytes per row and removes any limit concern — so we use it for file sizes.

### What is `ondelete="CASCADE"` vs `ondelete="SET NULL"`?

These control what happens when a **referenced row is deleted**:

- `CASCADE` — delete the child row too.
  Example: `client_id` on appointments. If a client is deleted, all their appointments are deleted too. Makes sense — appointments without a client are meaningless.

- `SET NULL` — set the foreign key to `NULL` instead of deleting.
  Example: `appointment_id` on attachments. If an appointment is deleted, the file stays but loses its appointment link. Makes sense — the file might still be valuable even without the appointment.

- `RESTRICT` (the default) — prevent deleting the parent if children exist. You'd have to delete children first.

Choosing the right `ondelete` behavior is an important data design decision.

---

*End of documentation. To dive into any specific area, start with the corresponding section above and then read the actual source file alongside it.*
