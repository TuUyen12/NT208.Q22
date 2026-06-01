# YinYang — Backend Documentation (Chi Tiết Từng Hàm)

> FastAPI + PostgreSQL + Redis + Celery · Python 3.12 · Async-first  
> Production: https://yinyang.io.vn

---

## Mục Lục

1. [Kiến Trúc Tổng Quan](#1-kiến-trúc-tổng-quan)
2. [app/main.py](#2-appmainpy)
3. [app/database.py](#3-appdatabasepy)
4. [app/dependencies.py](#4-appdependenciespy)
5. [app/core/config.py](#5-appccoreconfigpy)
6. [app/core/security.py](#6-appccoresecuritypy)
7. [app/core/encryption.py](#7-appccoreencryptionpy)
8. [app/core/rate_limit.py](#8-appccore-rate_limitpy)
9. [app/models/](#9-appmodels)
10. [app/schemas/](#10-appschemas)
11. [app/routers/auth.py](#11-approutersauthpy)
12. [app/routers/charts.py](#12-approuterschartspy)
13. [app/routers/ai_interpretation.py](#13-approutersai_interpretationpy)
14. [app/routers/chat.py](#14-approuterschatpy)
15. [app/routers/daily_horoscope.py](#15-approutersdaily_horoscopepy)
16. [app/routers/journal.py](#16-approutersjournalpy)
17. [app/routers/annotations.py](#17-approutersannotationspy)
18. [app/routers/notifications.py](#18-approutersnotificationspy)
19. [app/routers/calendar.py](#19-approuterscalendarpy)
20. [app/services/auth_service.py](#20-appservicesauth_servicepy)
21. [app/services/ai_service.py](#21-appservicesai_servicepy)
22. [app/services/luu_sao_utils.py](#22-appservicesluu_sao_utilspy)
23. [app/services/notification_service.py](#23-appservicesnotification_servicepy)
24. [app/services/calendar_service.py](#24-appservicescalendar_servicepy)
25. [app/services/chart_engine.py](#25-appserviceschart_enginepy)
26. [app/tasks/celery_app.py](#26-apptaskscelery_apppy)
27. [app/tasks/jobs.py](#27-apptasksjobspy)
28. [Alembic Migrations](#28-alembic-migrations)
29. [Environment Variables](#29-environment-variables)

---

## 1. Kiến Trúc Tổng Quan

```
Browser (React + iztro)
       │  HTTPS REST JSON /api/v1/…
       ▼
  Nginx :80/:4173
       │
       ▼
  FastAPI :8000 (uvicorn ASGI)
       │
       ├── PostgreSQL 16   (asyncpg driver — async queries)
       ├── Redis 7         (rate-limit sliding window + horoscope cache)
       └── Celery
             ├── worker    (executes tasks)
             └── beat      (cron scheduler)
                   ├── 00:05 ICT → recalculate_luu_sao_all_users
                   └── 07:00 ICT → send_daily_horoscope_emails
```

**Luồng request điển hình:**
```
Request → HTTPBearer (extract token) → decode_access_token (JWT verify)
       → get_current_user (DB lookup) → rate_limit (Redis check)
       → router handler → service/query → JSON response
```

---

## 2. `app/main.py`

### `lifespan(app)` — async context manager
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,   # Redis trả str thay vì bytes
    )
    yield
    await app.state.redis.aclose()
```
- Chạy **một lần** khi app khởi động và shutdown
- `app.state.redis` là shared connection pool — mọi request đều dùng qua `request.app.state.redis`
- `decode_responses=True`: tự decode bytes → str, không cần `.decode()` thủ công

### `_basic = HTTPBasic(auto_error=False)`
- `auto_error=False`: HTTPBasic sẽ không tự raise 401 nếu thiếu credentials — để `_docs_auth` tự xử lý logic (cho phép khi dev mode chưa set password)

### `_docs_auth(credentials)` — dependency bảo vệ Swagger UI
```python
def _docs_auth(credentials: HTTPBasicCredentials | None = Depends(_basic)):
    u = settings.DOCS_USERNAME
    p = settings.DOCS_PASSWORD
    if not u or not p:
        return              # dev mode — không cần auth
    if not credentials:
        raise HTTPException(401, headers={"WWW-Authenticate": "Basic"})
    ok = secrets.compare_digest(credentials.username, u) and \
         secrets.compare_digest(credentials.password, p)
    if not ok:
        raise HTTPException(401, headers={"WWW-Authenticate": "Basic"})
```
- `secrets.compare_digest` thay vì `==`: so sánh theo constant time, chống **timing attack** (attacker không thể đo thời gian để đoán ký tự đúng)
- Header `WWW-Authenticate: Basic` khiến trình duyệt hiển thị popup đăng nhập

### FastAPI instance
```python
app = FastAPI(
    docs_url=None,        # tắt /docs mặc định
    redoc_url=None,       # tắt /redoc mặc định
    openapi_url=None,     # tắt /openapi.json mặc định
    lifespan=lifespan,
)
```
Ba route này được tạo lại thủ công ở cuối file với `_docs_auth` dependency.

### Thứ tự đăng ký router
```python
# 1. daily_horoscope TRƯỚC add_middleware
app.include_router(daily_horoscope.router, prefix="/api/v1/daily-horoscope")

# 2. CORS middleware
app.add_middleware(CORSMiddleware, allow_origins=settings.ALLOWED_ORIGINS, ...)

# 3. Các router còn lại với rate_limit
_rate_limited = [Depends(rate_limit)]
app.include_router(auth.router, prefix="/api/v1/auth")           # không rate limit
app.include_router(charts.router, ..., dependencies=_rate_limited)
app.include_router(calendar.router, ..., dependencies=_rate_limited)
app.include_router(ai_interpretation.router, ..., dependencies=_rate_limited)
app.include_router(annotations.router, ..., dependencies=_rate_limited)
app.include_router(journal.router, ..., dependencies=_rate_limited)
app.include_router(notifications.router, ..., dependencies=_rate_limited)
app.include_router(chat.router, ..., dependencies=_rate_limited)
```
> **Ghi chú:** `auth` không có rate limit vì login/register cần accessible mọi lúc. Rate limit ở đây dựa vào `current_user` (JWT), nhưng auth endpoints chưa có JWT nên không thể dùng dependency đó.

### Routes cuối file
```python
GET /health            → {"status": "ok"}     (không auth, dùng cho Docker healthcheck)
GET /api/openapi.json  → app.openapi()         (Basic Auth)
GET /api/docs          → Swagger UI HTML       (Basic Auth)
GET /api/redoc         → ReDoc HTML            (Basic Auth)
GET /metrics           → Prometheus (tự tạo bởi Instrumentator)
```

---

## 3. `app/database.py`

### Engine
```python
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,      # in SQL ra console khi DEBUG=True
    pool_pre_ping=True,       # gửi SELECT 1 trước khi dùng connection
)
```
- `pool_pre_ping=True`: tránh lỗi `connection closed` khi PostgreSQL restart hay idle timeout. Trước mỗi query, SQLAlchemy test connection còn sống không
- `echo=True` trong dev: in toàn bộ SQL generated ra console, hữu ích để debug N+1 queries

### Session factory
```python
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,   # object dùng được sau commit()
)
```
- `expire_on_commit=False`: Mặc định SQLAlchemy mark tất cả attributes là "expired" sau `commit()` — truy cập attribute tiếp theo sẽ trigger SELECT mới. Với async, session có thể đã đóng → lỗi. Tắt đi để đọc attribute thoải mái sau commit

### `Base`
```python
class Base(DeclarativeBase):
    pass
```
Tất cả ORM models kế thừa `Base`. SQLAlchemy dùng `Base.metadata` để biết toàn bộ bảng (dùng trong Alembic autogenerate).

### `get_db()` — FastAPI dependency
```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
```
- `async with` tự close session sau request kể cả khi có exception
- Explicit rollback để không để lại transaction dở trong DB
- Inject vào handler: `db: AsyncSession = Depends(get_db)`

---

## 4. `app/dependencies.py`

### `bearer_scheme = HTTPBearer()`
Đọc `Authorization: Bearer <token>` từ header. Tự trả 403 nếu thiếu header (không có token).

### `get_current_user(credentials, db) -> User`
```python
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```
**Các bước:**
1. Extract JWT string từ `credentials.credentials`
2. `decode_access_token` → `None` nếu expired/invalid signature/type != "access"
3. Lấy `user_id` từ `sub` claim (UUID string)
4. `SELECT * FROM users WHERE user_id = ?`
5. 401 nếu không tìm thấy (user bị xóa sau khi token được cấp)
6. Return `User` ORM object

---

## 5. `app/core/config.py`

### `Settings` — Pydantic BaseSettings
Đọc env vars từ `.env` rồi `.env.local` (`.env.local` override). `lru_cache` đảm bảo chỉ parse **một lần**.

| Field | Type | Default | Bắt buộc | Mô tả |
|-------|------|---------|----------|-------|
| `APP_NAME` | str | "Tử Vi API" | | Tên app |
| `DEBUG` | bool | False | | In SQL, verbose |
| `DATABASE_URL` | str | | ✅ | `postgresql+asyncpg://user:pass@host/db` |
| `REDIS_URL` | str | | ✅ | `redis://host:6379/0` |
| `SECRET_KEY` | str | | ✅ | JWT signing key — startup fail nếu thiếu |
| `ALGORITHM` | str | "HS256" | | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | int | 60 | | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | int | 30 | | Refresh token TTL |
| `GOOGLE_CLIENT_ID` | str | "" | | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | str | "" | | Google OAuth |
| `GOOGLE_REDIRECT_URI` | str | localhost | | OAuth callback |
| `FIELD_ENCRYPTION_KEY` | str | | ✅ | 64-char hex (32 bytes AES-256) |
| `GEMINI_API_KEY` | str | "" | | Google Gemini |
| `RATE_LIMIT_REQUESTS` | int | 100 | | Max requests/window |
| `RATE_LIMIT_WINDOW_SECONDS` | int | 60 | | Window size |
| `ALLOWED_ORIGINS` | list[str] | localhost | | CORS allowlist |
| `FRONTEND_URL` | str | localhost:4173 | | OAuth redirect target |
| `DOCS_USERNAME` | str | "" | | Basic auth username cho /api/docs |
| `DOCS_PASSWORD` | str | "" | | Basic auth password. Trống = dev mode |
| `SMTP_HOST` | str | "smtp.gmail.com" | | SMTP server |
| `SMTP_PORT` | int | 587 | | STARTTLS port |
| `SMTP_USER` | str | "" | | Gmail account xác thực |
| `SMTP_PASSWORD` | str | "" | | Gmail App Password (16 ký tự) |
| `SMTP_FROM` | str | "" | | Địa chỉ From (alias). Fallback = SMTP_USER |

### `get_settings() -> Settings`
```python
@lru_cache
def get_settings() -> Settings:
    return Settings()
```
Singleton. Gọi nhiều lần vẫn trả cùng object. Tránh đọc file `.env` nhiều lần.

---

## 6. `app/core/security.py`

### `hash_password(password: str) -> str`
```python
salt = bcrypt.gensalt(rounds=12)
return bcrypt.hashpw(password.encode(), salt).decode()
```
- **12 rounds** (cost factor): ~250ms/hash trên hardware thông thường — đủ chậm để brute force không khả thi nhưng không ảnh hưởng UX
- Salt ngẫu nhiên mỗi lần: cùng password → hash khác nhau → chống rainbow table attack

### `verify_password(plain: str, hashed: str) -> bool`
```python
return bcrypt.checkpw(plain.encode(), hashed.encode())
```
bcrypt tự extract salt từ trong chuỗi hash. So sánh constant-time.

### `_create_token(data, expires_delta) -> str` — private
```python
payload = data.copy()
payload["exp"] = datetime.now(timezone.utc) + expires_delta
return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
```
Base function. `exp` claim là UNIX timestamp — `python-jose` tự validate khi decode.

### `create_access_token(subject: str) -> str`
```python
return _create_token(
    {"sub": subject, "type": "access"},
    timedelta(minutes=60)
)
```
- `sub`: `user_id` dạng UUID string
- `type: "access"`: phân biệt với refresh token để không dùng nhầm

### `create_refresh_token(subject: str) -> str`
Giống nhưng TTL 30 ngày và `type: "refresh"`.  
**Lưu ý:** Refresh token endpoint (`/auth/refresh`) chưa được implement — infrastructure đã có nhưng chưa expose API.

### `decode_access_token(token: str) -> dict | None`
```python
try:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    if payload.get("type") != "access":
        return None      # từ chối refresh token nếu ai cố dùng nhầm
    return payload
except JWTError:
    return None          # expired, bad signature, malformed
```
Trả `None` thay vì raise exception để caller quyết định cách xử lý.

---

## 7. `app/core/encryption.py`

Mã hóa `dob_solar` và `birth_hour` trước khi lưu DB. Dùng **AES-256-GCM**.

### `_get_key() -> bytes`
```python
return bytes.fromhex(settings.FIELD_ENCRYPTION_KEY)
```
Convert 64-char hex string → 32 bytes. Key dùng chung cho toàn bộ app (single-tenant).

### `encrypt_field(plaintext: str) -> str`
```python
nonce = os.urandom(12)                          # 12 bytes ngẫu nhiên mỗi lần
ct = AESGCM(key).encrypt(nonce, plaintext.encode(), None)
return base64.b64encode(nonce + ct).decode()
```
- **Nonce 12 bytes ngẫu nhiên**: đảm bảo cùng plaintext → ciphertext khác nhau mỗi lần encrypt
- **AES-256-GCM** (Galois/Counter Mode): *authenticated encryption* — vừa encrypt vừa tạo authentication tag 16 bytes. Nếu ai sửa ciphertext, decrypt sẽ raise `InvalidTag` exception
- Output: `base64(nonce[12 bytes] + ciphertext + auth_tag[16 bytes])`
- Tại sao GCM thay vì CBC? CBC chỉ encrypt, không detect tampering. GCM đảm bảo cả confidentiality + integrity

### `decrypt_field(ciphertext: str) -> str`
```python
raw = base64.b64decode(ciphertext.encode())
nonce, ct = raw[:12], raw[12:]
return AESGCM(key).decrypt(nonce, ct, None).decode()
```
Tách 12 bytes đầu là nonce, phần còn lại là ciphertext+tag. AESGCM tự verify tag trước khi decrypt.

---

## 8. `app/core/rate_limit.py`

### `rate_limit(request, current_user)` — FastAPI dependency

Thuật toán **Sliding Window** dùng Redis Sorted Set:

```python
key = f"rate:{current_user.user_id}"
now = int(time.time())                           # UNIX timestamp hiện tại
window_start = now - RATE_LIMIT_WINDOW_SECONDS  # 60 giây trước

pipe = redis.pipeline()
pipe.zremrangebyscore(key, 0, window_start)  # xóa timestamps cũ hơn 60s
pipe.zadd(key, {str(now): now})              # thêm timestamp hiện tại (score=time)
pipe.zcard(key)                              # đếm phần tử còn lại (= requests trong 60s)
pipe.expire(key, RATE_LIMIT_WINDOW_SECONDS)  # auto-cleanup key sau 60s
results = await pipe.execute()              # 1 round-trip Redis duy nhất

count = results[2]
if count > RATE_LIMIT_REQUESTS:             # > 100
    raise HTTPException(429, headers={"Retry-After": "60"})
```

**Redis Pipeline:** Gửi 4 lệnh trong 1 network round-trip. Không dùng pipeline → 4 round-trips riêng = chậm hơn 4x.

**Sorted Set:** `ZADD key {member: score}` — member là timestamp string (đảm bảo unique), score là UNIX timestamp (dùng để range query bằng `ZREMRANGEBYSCORE`).

**Tại sao Sliding Window tốt hơn Fixed Window?**
- Fixed Window: window reset mỗi 60s. Có thể gửi 100 req cuối window + 100 req đầu window mới = 200 req trong 2 giây
- Sliding Window: bất kỳ khoảng 60s nào cũng ≤ 100 req

---

## 9. `app/models/`

### `user.py` — `User`
```
users
├── user_id         UUID PK, default uuid4
├── email           String(255), unique, NOT NULL, indexed
├── full_name       String(255), nullable
├── hashed_password String(255), nullable  ← null = OAuth user (không có mật khẩu)
├── google_id       String(255), unique, nullable
├── is_active       Boolean, default True  ← False = queued for deletion
├── created_at      DateTime(tz), server_default=now()
├── last_login      DateTime(tz), nullable
├── streak_count    Integer, default 0     ← consecutive daily checkins
└── notify_channel  Enum('email','push','both'), default 'email'
```

Relationships (tất cả `cascade="all, delete-orphan"`):
- `charts` → `Chart`
- `annotations` → `Annotation`  
- `journal_logs` → `JournalLog`
- `notifications` → `Notification`

### `chart.py` — `Chart`
```
charts
├── chart_id          UUID PK
├── user_id           UUID, FK → users (CASCADE DELETE)
├── name              String(255), NOT NULL    ← tên người được xem
├── gender            String(10), NOT NULL     ← "male" | "female"
├── dob_solar_enc     Text, NOT NULL           ← AES-256-GCM encrypted "YYYY-MM-DD"
├── birth_hour_enc    Text, NOT NULL           ← AES-256-GCM encrypted "HH:MM"
├── dob_lunar_year    Integer
├── dob_lunar_month   Integer
├── dob_lunar_day     Integer
├── dob_lunar_leap    Boolean                  ← tháng nhuận?
├── chart_matrix      JSONB                    ← toàn bộ data từ iztro
├── ai_interpretation JSONB, nullable          ← cached Gemini response
├── ai_cached_at      DateTime(tz), nullable
└── created_at        DateTime(tz), server_default=now()
```

> `chart_matrix` JSONB structure (từ iztro):
> ```json
> {
>   "soul": "Tử Vi",     "body": "Thiên Cơ",
>   "fiveElementsClass": "Thủy Nhị Cục",
>   "palaces": [
>     {
>       "name": "命宫",           "earthlyBranch": "寅",
>       "majorStars": [{"name": "紫微", ...}],
>       "minorStars": [...],
>       "adjectiveStars": [...],
>       "decadal": {"range": [2, 11], ...}
>     }, ...  (12 cung)
>   ]
> }
> ```

### `annotation.py` — `Annotation`
```
annotations
├── annotation_id  UUID PK
├── user_id        UUID, FK → users
├── chart_id       UUID, FK → charts
├── house_number   Integer, nullable (1–12; null = ghi chú chung)
├── star_name      String(100), nullable
├── content        Text, NOT NULL
├── created_at     DateTime(tz)
└── modified_at    DateTime(tz), onupdate=func.now()
```

### `journal.py` — `JournalLog`
```
journal_logs
├── log_id             UUID PK
├── user_id            UUID, FK → users, indexed
├── log_date           Date, NOT NULL, indexed
├── content            Text, nullable
└── luu_sao_positions  JSONB, nullable
```
Constraint (không tường minh trong code, enforce ở app layer): unique(user_id, log_date).

`luu_sao_positions` JSONB:
```json
{
  "luu_nhat": {
    "can": "Giáp", "chi": "Thìn",
    "Lưu Nhật Lộc Tồn":   {"chi": "Dần",  "house": 10},
    "Lưu Nhật Kình Dương": {"chi": "Mão",  "house": 11},
    "Lưu Nhật Đà La":      {"chi": "Sửu",  "house": 9},
    "Lưu Nhật Thiên Mã":   {"chi": "Dần",  "house": 10},
    "Lưu Nhật Thái Tuế":   {"chi": "Thìn", "house": 12},
    "Lưu Nhật Tang Môn":   {"chi": "Ngọ",  "house": 2},
    "Lưu Nhật Bạch Hổ":    {"chi": "Tuất", "house": 6},
    "tu_hoa": {"Liêm Trinh": "Hóa Lộc", "Phá Quân": "Hóa Quyền", ...}
  },
  "luu_nguyet": { ... },
  "luu_nien":   { ... }
}
```

### `notification.py` — `Notification`
```
notifications
├── id           UUID PK, default uuid4
├── user_id      UUID, FK → users (CASCADE DELETE), indexed
├── title        String(255), NOT NULL
├── body         Text, NOT NULL
├── notif_type   String(50), default "info"  ← "info" | "luu_sao" | "system"
├── is_read      Boolean, default False, NOT NULL
└── created_at   DateTime(tz), server_default=now()
```

---

## 10. `app/schemas/`

### `auth.py`

**`RegisterRequest`**
```python
email: EmailStr          # Pydantic validate format
password: str            # validator: len >= 8, raise ValueError nếu không đủ
full_name: Optional[str] = None
```

**`LoginRequest`**
```python
email: EmailStr
password: str
```

**`TokenResponse`**
```python
access_token: str
refresh_token: str
token_type: str = "bearer"
```

**`UserResponse`** — trả về từ GET/PATCH /me
```python
user_id: UUID
email: str
full_name: Optional[str] = None
streak_count: int
notify_channel: str = "email"
created_at: Optional[datetime] = None
last_login: Optional[datetime] = None
has_password: bool = False      # derived field — tính từ hashed_password is not None
                                # không lưu trong DB, router tính thủ công
model_config = {"from_attributes": True}
```

**`UpdateProfileRequest`**
```python
full_name: Optional[str] = None
notify_channel: Optional[str] = None  # validator: phải là "email"|"push"|"both"
```
Cả hai field Optional — partial update.

**`ChangePasswordRequest`**
```python
current_password: str
new_password: str    # validator: len >= 8
```

### `chart.py`

**`ChartCreateRequest`**
```python
name: str
gender: str                    # "male" | "female"
dob_solar: str                 # "YYYY-MM-DD"
birth_hour: Optional[str]      # "HH:MM" — None → default "12:00"
chart_matrix: dict             # JSON từ iztro (toàn bộ palace data)
timezone_offset: int = 7       # UTC+7 Vietnam
```

**`ChartResponse`** — dict thủ công (không Pydantic model), built bởi `_build_chart_response()`
```python
{
  "chart_id": UUID,
  "user_id": UUID,
  "name": str,
  "gender": str,
  "dob_solar": str,       # decrypted
  "birth_hour": str,      # decrypted
  "lunar_date": {"year": int, "month": int, "day": int, "is_leap_month": bool},
  "chart_matrix": dict,
  "ai_interpretation": dict | None,
  "created_at": datetime
}
```

### `annotation.py`

**`AnnotationCreateRequest`**
```python
chart_id: UUID
house_number: Optional[int] = None    # 1–12
star_name: Optional[str] = None
content: str
```

**`AnnotationUpdateRequest`**
```python
content: Optional[str] = None
house_number: Optional[int] = None
star_name: Optional[str] = None
```
`model_dump(exclude_none=True)` dùng khi PATCH để chỉ update các field có giá trị.

**`AnnotationResponse`**
```python
annotation_id: UUID
chart_id: UUID
house_number: Optional[int]
star_name: Optional[str]
content: str
created_at: datetime
modified_at: datetime
model_config = {"from_attributes": True}
```

### `journal.py`

**`JournalLogCreate`**
```python
log_date: date
content: Optional[str] = None
```

**`JournalLogUpdate`**
```python
content: Optional[str] = None
```

**`JournalLogResponse`**
```python
log_id: UUID
log_date: date
content: Optional[str]
luu_sao_positions: Optional[dict]
model_config = {"from_attributes": True}
```

---

## 11. `app/routers/auth.py`

### `POST /register` → `RegisterResponse` (201)

```python
async def register(body: RegisterRequest, db):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Registration failed")   # KHÔNG nói "email đã tồn tại"
    user = await AuthService.register(db, body.email, body.password, body.full_name)
    return user
```

**Tại sao message chung "Registration failed"?** User enumeration attack: nếu trả "email đã tồn tại", attacker có thể check email nào đã đăng ký trong hệ thống.

### `POST /login` → `TokenResponse`

```python
async def login(body: LoginRequest, db):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not AuthService.verify_password(body.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")    # cùng message cho cả 2 trường hợp
    user.last_login = datetime.utcnow()
    await db.commit()
    return AuthService.create_tokens(str(user.user_id))
```

**Lưu ý bảo mật:** Dù user không tồn tại hay sai password đều trả cùng message. Nếu trả "user not found" vs "wrong password", attacker biết email nào valid.

**`AuthService.verify_password`** trả `False` nếu `hashed_password is None` (OAuth user cố đăng nhập bằng email/password).

### `GET /google/login` → RedirectResponse
Redirect browser đến Google consent screen. URL có: `client_id`, `redirect_uri`, `response_type=code`, `scope=openid email profile`.

### `GET /google/callback?code=...` → RedirectResponse
```python
async def google_callback(code: str, db):
    user = await AuthService.google_callback(db, code)    # upsert user
    tokens = AuthService.create_tokens(str(user.user_id))
    return RedirectResponse(
        f"{FRONTEND_URL}/auth/callback"
        f"?access_token={tokens.access_token}"
        f"&refresh_token={tokens.refresh_token}"
    )
```
Tokens truyền qua URL params → `AuthCallback.jsx` đọc và lưu vào localStorage.

**Tại sao tokens trong URL params thay vì body?** Redirect response không có request body. Frontend phải đọc từ URL.

### `GET /me` → `UserResponse`
```python
async def me(current_user: User = Depends(get_current_user)):
    data = UserResponse.model_validate(current_user)  # ORM → Pydantic
    data.has_password = current_user.hashed_password is not None
    return data
```
`has_password` tính sau `model_validate` vì không có trong DB model.

### `PATCH /me` → `UserResponse`
```python
async def update_profile(body: UpdateProfileRequest, current_user, db):
    if body.full_name is not None:
        current_user.full_name = body.full_name.strip() or None
        # .strip() → xóa whitespace thừa
        # or None → "" trở thành None (không lưu tên trống)
    if body.notify_channel is not None:
        current_user.notify_channel = body.notify_channel
    await db.commit()
    await db.refresh(current_user)    # reload từ DB để có giá trị mới nhất
    data = UserResponse.model_validate(current_user)
    data.has_password = current_user.hashed_password is not None
    return data
```

### `PUT /me/password` → 204 No Content
```python
async def change_password(body: ChangePasswordRequest, current_user, db):
    if not AuthService.verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(400, "Mật khẩu hiện tại không đúng")
    from app.core.security import hash_password
    current_user.hashed_password = hash_password(body.new_password)
    await db.commit()
```
Import `hash_password` inline để tránh circular import (auth_service cũng import từ security).

### `DELETE /me` → 202 Accepted
```python
await AuthService.queue_deletion(db, current_user)  # is_active = False
return {"detail": "Deletion request received. Data will be removed within 30 days."}
```
202 (Accepted) thay vì 204 (No Content) vì deletion chưa xảy ra ngay — chỉ queued.

---

## 12. `app/routers/charts.py`

### `_get_owned_chart(db, chart_id, user_id) -> Chart` — private helper
```python
async def _get_owned_chart(db, chart_id, user_id):
    result = await db.execute(select(Chart).where(Chart.chart_id == chart_id))
    chart = result.scalar_one_or_none()
    if not chart:
        raise HTTPException(404, "Chart not found")
    if chart.user_id != user_id:
        raise HTTPException(403, "Forbidden")    # không reveal chart tồn tại hay không với user khác
    return chart
```
**Pattern quan trọng:** Luôn fetch trước rồi check ownership sau. Không dùng `WHERE chart_id=? AND user_id=?` vì: nếu chart không tồn tại → 404, nếu không phải của mình → 403. Hai error code khác nhau giúp debug.

### `_build_chart_response(chart) -> dict` — private helper
```python
def _build_chart_response(chart: Chart) -> dict:
    return {
        "chart_id": chart.chart_id,
        ...
        "dob_solar":  decrypt_field(chart.dob_solar_enc),    # LUÔN decrypt trước khi return
        "birth_hour": decrypt_field(chart.birth_hour_enc),
        "lunar_date": {
            "year": chart.dob_lunar_year, "month": chart.dob_lunar_month,
            "day": chart.dob_lunar_day,   "is_leap_month": chart.dob_lunar_leap,
        },
        "chart_matrix": chart.chart_matrix,
        "ai_interpretation": chart.ai_interpretation,
        "created_at": chart.created_at,
    }
```
Không bao giờ return `dob_solar_enc` hay `birth_hour_enc` trực tiếp.

### `GET /latest` — **phải đăng ký TRƯỚC `/{chart_id}`**
```python
@router.get("/latest", response_model=ChartResponse)
async def get_latest_chart(current_user, db):
    result = await db.execute(
        select(Chart)
        .where(Chart.user_id == current_user.user_id)
        .order_by(Chart.created_at.desc())
        .limit(1)
    )
    chart = result.scalar_one_or_none()
    if not chart:
        raise HTTPException(404, "No chart found")
    return _build_chart_response(chart)
```
**Tại sao phải đặt trước `/{chart_id}`?** FastAPI match routes theo thứ tự đăng ký. Nếu `/{chart_id}` đăng ký trước, FastAPI sẽ cố parse "latest" như UUID → validation error.

### `POST /` → `ChartResponse` (201)
```python
async def create_chart(body: ChartCreateRequest, current_user, db):
    birth_hour = body.birth_hour or "12:00"    # default nếu không cung cấp
    warned = body.birth_hour is None

    lunar = ChartEngine.solar_to_lunar(body.dob_solar, body.timezone_offset)

    chart = Chart(
        user_id=current_user.user_id,
        name=body.name, gender=body.gender,
        dob_solar_enc=encrypt_field(str(body.dob_solar)),
        birth_hour_enc=encrypt_field(birth_hour),
        dob_lunar_year=lunar["year"],
        dob_lunar_month=lunar["month"],
        dob_lunar_day=lunar["day"],
        dob_lunar_leap=lunar["is_leap_month"],
        chart_matrix=body.chart_matrix,
    )
    db.add(chart)
    await db.commit()
    await db.refresh(chart)

    response = _build_chart_response(chart)
    if warned:
        response["birth_hour_defaulted"] = True    # thông báo FE rằng đã dùng default
    return response
```
**Tại sao lưu cả lunar date plaintext?** Để query/filter theo năm/tháng âm lịch mà không cần decrypt. Chỉ ngày dương lịch và giờ sinh mới nhạy cảm.

**`db.refresh(chart)`**: Sau `commit()`, `chart.chart_id` và `chart.created_at` (server_default) chưa được load vào Python object. `refresh` trigger SELECT để lấy giá trị thật.

---

## 13. `app/routers/ai_interpretation.py`

### `POST /{chart_id}/interpret`
```python
async def interpret_chart(chart_id, current_user, db):
    # 1. Fetch + verify ownership
    chart = ...
    if chart.user_id != current_user.user_id:
        raise HTTPException(403)

    # 2. Cache check
    if chart.ai_interpretation:
        return {"interpretation": chart.ai_interpretation, "cached": True}

    # 3. Call Gemini
    interpretation = await AIService.interpret(chart.chart_matrix)

    # 4. Persist cache
    chart.ai_interpretation = interpretation
    chart.ai_cached_at = datetime.utcnow()
    await db.commit()

    return {"interpretation": interpretation, "cached": False}
```
**Cache strategy:** Lưu mãi trong `charts.ai_interpretation`. Không expire — interpretation của lá số không thay đổi theo thời gian. Chỉ mất khi chart bị xóa.

---

## 14. `app/routers/chat.py`

### Constants
```python
_GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"

_BASE_SYSTEM_PROMPT = """Bạn là chuyên gia Tử Vi Đẩu Số của YinYang...
Luôn trả lời bằng tiếng Việt, ngắn gọn...
Nếu câu hỏi không liên quan đến Tử Vi, hãy nhẹ nhàng hướng về chủ đề đó."""
```

### `_build_system_prompt(chart) -> str`
```python
def _build_system_prompt(chart: Chart | None) -> str:
    if chart is None:
        return _BASE_SYSTEM_PROMPT    # không personalized

    parts = [_BASE_SYSTEM_PROMPT,
             f"Bạn đang tư vấn cho: {chart.name} ({chart.gender}).",
             "=== LÁ SỐ TỬ VI ===",
             _summarise_matrix(chart.chart_matrix),   # từ ai_service
             "=== KẾT THÚC ==="]

    if chart.ai_interpretation:
        ai = chart.ai_interpretation
        if ai.get("overall"):
            parts.append(f"Tóm tắt: {ai['overall']}")

    parts.append("Hãy trả lời cá nhân hóa, đề cập sao/cung cụ thể khi phù hợp.")
    return "\n".join(parts)
```

### `POST /` → `ChatResponse`
```python
async def chat(body: ChatRequest, current_user, db):
    # 1. Load chart mới nhất (optional)
    latest_chart = ...

    # 2. Build system prompt
    system_prompt = _build_system_prompt(latest_chart)

    # 3. Xây contents: [system turn, model greeting, ...history[-10:], user message]
    contents = [
        {"role": "user", "parts": [{"text": system_prompt}]},
        {"role": "model", "parts": [{"text": "Xin chào! Tôi là chuyên gia Tử Vi..."}]},
    ]
    for msg in body.history[-10:]:           # chỉ 10 messages gần nhất
        contents.append({"role": msg.role, "parts": [{"text": msg.text}]})
    contents.append({"role": "user", "parts": [{"text": body.message}]})

    # 4. Call Gemini
    resp = await httpx.AsyncClient(timeout=30.0).post(...)
    reply = data["candidates"][0]["content"]["parts"][0]["text"]
    return ChatResponse(reply=reply.strip())
```

**Tại sao giới hạn 10 messages?** Gemini có context window limit. 10 messages (~5 turns) đủ cho hội thoại tự nhiên mà không tốn nhiều token.

**Gemini Conversation Format:** Gemini không có explicit "system" role — system prompt được truyền như role "user" đầu tiên, model reply như role "model". Sau đó conversation tiếp tục xen kẽ user/model.

---

## 15. `app/routers/daily_horoscope.py`

Module phức tạp nhất — kết hợp lịch cổ học, Lưu Sao, lá số cá nhân, và Gemini.

### Constants & Lookup Tables

```python
_CAN = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"]  # 10 Thiên Can
_CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"]  # 12 Địa Chi
_HANH = ["Mộc","Mộc","Hỏa","Hỏa","Thổ","Thổ","Kim","Kim","Thủy","Thủy"]   # ngũ hành theo Can
_TRUC = ["Kiến","Trừ","Mãn","Bình","Định","Chấp","Phá","Nguy","Thành","Thu","Khai","Bế"]  # 12 trực

_GIO_HOANG_DAO = {
    0: [0,1,3,6,7,9],    # Chi ngày Tý → 6 giờ Hoàng Đạo
    1: [1,2,4,7,8,10],   # Chi ngày Sửu
    ...                  # pattern lặp lại theo chu kỳ
}
_GIO_NAMES = [
    ("Tý","23:00–01:00"), ("Sửu","01:00–03:00"), ...  # 12 giờ Chi
]
_WEEKDAYS_VN = ["Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy","Chủ Nhật"]
_BRANCH_ORDER_CN = ["巳","午","未","申","酉","戌","亥","子","丑","寅","卯","辰"]  # house 1–12
```

**`_TRUC` (12 Trực):** Còn gọi là "Kiến Trừ Thập Nhị Trực" — 12 thần cai quản từng ngày theo chu kỳ. Mỗi trực có đặc tính riêng (Kiến = khởi đầu tốt, Phá = phá hỏng, Thành = thành công...). Tính từ Chi ngày.

**`_GIO_HOANG_DAO`:** Bảng giờ Hoàng Đạo theo Chi ngày. 6 giờ tốt cho hành động quan trọng. Mỗi ô là list index vào `_GIO_NAMES`.

### `_jdn(y, m, d) -> int` — Julian Day Number
```python
def _jdn(y, m, d) -> int:
    a = (14 - m) // 12
    yy = y + 4800 - a
    mm = m + 12 * a - 3
    return d + (153*mm + 2)//5 + 365*yy + yy//4 - yy//100 + yy//400 - 32045
```
Proleptic Gregorian calendar formula. Trả số ngày liên tục từ 1/1/4713 BC. Nền tảng của tất cả tính toán lịch.

**Xác minh:** `_jdn(2024,1,1) = 2460310`. `(2460310 + 49) % 60 = 359 % 60 = 59`. `59 % 10 = 9` → _CAN[9] = "Quý". `59 % 12 = 11` → _CHI[11] = "Hợi". Ngày 1/1/2024 = Quý Hợi ✓

### `_get_day_metadata(d: date) -> dict`
```python
def _get_day_metadata(d):
    pos = (_jdn(d.year, d.month, d.day) + 49) % 60
    can_idx = pos % 10
    chi_idx = pos % 12
    hanh = _HANH[can_idx]
    truc = _TRUC[chi_idx]          # trực ngày = _TRUC[chi_index]
    gio_hd_indices = _GIO_HOANG_DAO[chi_idx]
    gio_hd = [f"Giờ {_GIO_NAMES[i][0]} ({_GIO_NAMES[i][1]})" for i in gio_hd_indices[:4]]
    return {
        "thu": _WEEKDAYS_VN[d.weekday()],
        "can_chi": f"{_CAN[can_idx]} {_CHI[chi_idx]}",
        "hanh_can": hanh,
        "truc": truc,
        "gio_hoang_dao": gio_hd,    # 4 giờ đầu trong 6 giờ Hoàng Đạo
    }
```

### `_map_sao_to_palaces(sao_nhat, chart_matrix) -> str`

Đây là core logic của tính năng personalization:

```python
def _map_sao_to_palaces(sao_nhat, chart_matrix) -> str:
    # 1. Build house → palace mapping từ chart
    palaces = chart_matrix.get("palaces", [])
    house_to_palace = {}
    for p in palaces:
        branch_cn = p.get("earthlyBranch", "")          # e.g. "寅"
        if branch_cn in _BRANCH_ORDER_CN:
            house_idx = _BRANCH_ORDER_CN.index(branch_cn) + 1   # 1–12
            name_vi = _PALACE_VI.get(p.get("name"), p.get("name"))  # "命宫" → "Mệnh"
            major = [s.get("name") for s in p.get("majorStars", [])]
            minor = [...p.get("minorStars") + p.get("adjectiveStars")][:4]
            house_to_palace[house_idx] = {"name": name_vi, "major": major, "minor": minor}

    # 2. Map từng sao nhật → cung tương ứng
    lines = [f"Sao Nhật ngày {sao_nhat['can']} {sao_nhat['chi']} chiếu vào lá số:"]
    for key in ("Lưu Nhật Lộc Tồn", "Lưu Nhật Kình Dương", "Lưu Nhật Đà La",
                "Lưu Nhật Thiên Mã", "Lưu Nhật Tang Môn", "Lưu Nhật Bạch Hổ"):
        if key not in sao_nhat:
            continue
        house = sao_nhat[key]["house"]       # house index 1–12
        chi   = sao_nhat[key]["chi"]
        palace = house_to_palace.get(house, {})
        palace_name = palace.get("name", f"nhà {house}")
        major_str = ", ".join(palace.get("major", [])) or "không chính tinh"
        lines.append(f"  • {key} tại {chi} (nhà {house}) → Cung {palace_name} [{major_str}]")

    # 3. Thêm Tứ Hóa
    if tu_hoa := sao_nhat.get("tu_hoa", {}):
        hoa_str = "  |  ".join(f"{star} {hoa}" for star, hoa in tu_hoa.items())
        lines.append(f"  • Tứ Hóa ngày: {hoa_str}")

    return "\n".join(lines)
```

**Output ví dụ:**
```
Sao Nhật ngày Giáp Thìn chiếu vào lá số:
  • Lưu Nhật Lộc Tồn tại Dần (nhà 10) → Cung Tài Bạch [Vũ Khúc, Thiên Phủ]
  • Lưu Nhật Kình Dương tại Mão (nhà 11) → Cung Tử Tức [Thái Dương]
  • Tứ Hóa ngày: Liêm Trinh Hóa Lộc  |  Phá Quân Hóa Quyền  |  ...
```
Gemini nhận text này và biết chính xác sao nào đang ảnh hưởng cung nào trong lá số của user.

### `_build_prompt(chart, today) -> str`

Prompt 3 tầng:
1. **Metadata ngày:** Can Chi, trực, giờ Hoàng Đạo, sao nhật tóm tắt
2. **Lá số:** `_summarise_matrix()` + `_map_sao_to_palaces()`
3. **Rules cá nhân hóa:** Yêu cầu Gemini nêu tên cung cụ thể, Lộc Tồn đang ở cung nào, Kình Dương ở đâu

```python
personalized_rules = (
    f"--- YÊU CẦU CÁ NHÂN HÓA ---\n"
    f'• "nen_lam": Ưu tiên cung {loc_cung} (Lộc Tồn đóng đây hôm nay)...\n'
    f'• "nen_tranh": Cung {kinh_cung} bị Kình Dương — cẩn thận...\n'
    f"TUYỆT ĐỐI không viết chung chung."
)
```

**Output JSON từ Gemini:**
```json
{
  "tong_quan": "...",
  "nen_lam": ["...", "...", "..."],
  "nen_tranh": ["...", "...", "..."],
  "gio_tot": ["Giờ Dần (03:00–05:00) — lý do...", ...],
  "mau_may_man": "...",
  "con_so_may_man": "...",
  "loi_khuyen": "..."
}
```

### Redis helpers

```python
_CACHE_VER = "v3"   # bump string này để invalidate toàn bộ cache cũ

def _horoscope_key(user_id, date_str):
    return f"horoscope:{_CACHE_VER}:{user_id}:{date_str}"   # unique per user per day

def _checkin_key(user_id, date_str):
    return f"checkin:{user_id}:{date_str}"                  # dùng cho streak

def _seconds_until_midnight_utc() -> int:
    now = datetime.now(timezone.utc)
    midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return max(int((midnight - now).total_seconds()), 1)    # TTL = hết hạn lúc 00:00 UTC
```

### `_update_streak(redis, db, user, today) -> int`

```python
async def _update_streak(redis, db, user, today):
    # 1. Check đã checkin hôm nay chưa
    already = await redis.exists(_checkin_key(user.user_id, today))
    if already:
        return user.streak_count     # idempotent — không tăng lần 2

    # 2. Check có checkin hôm qua không
    yesterday = (date.fromisoformat(today) - timedelta(days=1)).isoformat()
    had_yesterday = await redis.exists(_checkin_key(user.user_id, yesterday))

    # 3. Tính streak mới
    new_streak = (user.streak_count + 1) if had_yesterday else 1
    # Reset về 1 nếu bỏ ngày, tăng nếu liên tục

    # 4. Persist DB
    db_user = await db.execute(select(User).where(User.user_id == user.user_id))
    db_user.scalar_one().streak_count = new_streak
    await db.commit()

    # 5. Mark checkin Redis với TTL 48h (buffer qua midnight)
    await redis.setex(_checkin_key(user.user_id, today), 48 * 3600, "1")

    return new_streak
```

**Tại sao TTL 48h?** Nếu dùng 24h, key hết hạn đúng lúc midnight → có thể race condition với timezone. 48h an toàn hơn.

### `HoroscopeResponse` schema
```python
class HoroscopeResponse(BaseModel):
    date: str
    needs_chart: bool = False      # True → user chưa có lá số
    tong_quan: str = ""
    nen_lam: list[str] = []
    nen_tranh: list[str] = []
    gio_tot: list[str] = []
    mau_may_man: str = ""
    con_so_may_man: str = ""
    loi_khuyen: str = ""
    cached: bool = False           # True → trả từ Redis cache
    personalized: bool = False     # True → dựa trên lá số cá nhân
    streak: int = 0                # số ngày liên tiếp checkin
    sao_nhat: dict = {}            # Lưu Nhật data (hiển thị SaoNhatCard trên FE)
```

### `GET /` → `HoroscopeResponse` — luồng đầy đủ

```python
async def get_daily_horoscope(request, current_user, db):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(503, "AI service not configured")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    redis = request.app.state.redis
    sao_nhat = calculate_luu_nhat(date.fromisoformat(today))

    # 1. Update streak (idempotent)
    streak = await _update_streak(redis, db, current_user, today)

    # 2. Check Redis cache
    cached_raw = await redis.get(_horoscope_key(current_user.user_id, today))
    if cached_raw:
        data = json.loads(cached_raw)
        return HoroscopeResponse(**data, date=today, cached=True, streak=streak, sao_nhat=sao_nhat)

    # 3. Load chart
    latest_chart = ...  # SELECT * ORDER BY created_at DESC LIMIT 1

    # 4. Không có chart → placeholder
    if latest_chart is None:
        return HoroscopeResponse(date=today, needs_chart=True, streak=streak, sao_nhat=sao_nhat)

    # 5. Build prompt + call Gemini
    prompt = _build_prompt(latest_chart, today)
    resp = await httpx.AsyncClient(timeout=30.0).post(
        f"{_GEMINI_URL}?key={GEMINI_API_KEY}",
        json={
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.9, "maxOutputTokens": 1500},
        }
    )

    # 6. Parse JSON từ response
    text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    if text.startswith("```"):     # strip markdown code fence nếu có
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    horoscope = json.loads(text.strip())

    # 7. Fill defaults cho missing keys
    defaults = {"tong_quan": "", "nen_lam": [], "nen_tranh": [], ...}
    for k, v in defaults.items():
        horoscope.setdefault(k, v)

    # 8. Cache Redis cho đến 00:00 UTC
    to_cache = {k: horoscope[k] for k in defaults} | {"personalized": True}
    await redis.setex(cache_key, _seconds_until_midnight_utc(), json.dumps(to_cache))

    return HoroscopeResponse(**horoscope, date=today, streak=streak, sao_nhat=sao_nhat)
```

**temperature=0.9** (cao hơn interpretation): Muốn horoscope sáng tạo, không lặp lại mỗi ngày. Interpretation dùng 0.7 (thấp hơn) để consistent.

---

## 16. `app/routers/journal.py`

### `GET /stars` — **phải đăng ký TRƯỚC `/{log_date}`**

```python
@router.get("/stars", response_model=dict)
async def get_stars_for_date(date_str: date, current_user):
    return calculate_all_tiers(date_str)
```

**Vấn đề routing:** Nếu `/{log_date}` đăng ký trước, FastAPI match `/stars?date_str=...` với route `/{log_date}` và cố parse `log_date` từ path. Vì không có path segment nào → 422. Giải pháp: `/stars` đăng ký trước. (Lưu ý: `date_str` là query param, không phải path param.)

### `POST /` → `JournalLogResponse` (201) — upsert logic

```python
async def create_or_update_log(body: JournalLogCreate, current_user, db):
    # 1. Check đã có entry hôm nay chưa
    result = await db.execute(
        select(JournalLog).where(
            JournalLog.user_id == current_user.user_id,
            JournalLog.log_date == body.log_date,
        )
    )
    log = result.scalar_one_or_none()

    # 2. Tính Lưu Sao
    luu_sao = calculate_all_tiers(body.log_date)

    # 3. Upsert
    if log:
        log.content = body.content
        log.luu_sao_positions = luu_sao    # refresh Lưu Sao nếu đã có entry
    else:
        log = JournalLog(user_id=..., log_date=body.log_date, content=..., luu_sao_positions=luu_sao)
        db.add(log)

    await db.commit()
    await db.refresh(log)
    return log
```

**Tại sao upsert thay vì tạo mới?** Mỗi ngày chỉ có 1 entry per user. Frontend gọi POST khi lần đầu lưu trong ngày, PATCH khi sửa.

### `_get_owned_log(db, log_date, user_id) -> JournalLog` — private helper

```python
async def _get_owned_log(db, log_date, user_id):
    result = await db.execute(
        select(JournalLog).where(
            JournalLog.user_id == user_id,
            JournalLog.log_date == log_date,
        )
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(404, "Log not found")
    return log
```
Không cần check ownership riêng vì query đã `WHERE user_id = ?` — không thể access log của người khác.

---

## 17. `app/routers/annotations.py`

### `PATCH /{annotation_id}` — partial update pattern

```python
async def update_annotation(annotation_id, body: AnnotationUpdateRequest, current_user, db):
    annotation = await _get_owned_annotation(db, annotation_id, current_user.user_id)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(annotation, field, value)    # chỉ update các field có giá trị
    await db.commit()
    await db.refresh(annotation)
    return annotation
```

`body.model_dump(exclude_none=True)`: Convert Pydantic model → dict, bỏ qua các field là `None`. Dùng `setattr` để update ORM object động thay vì hard-code từng field.

### `_get_owned_annotation(db, annotation_id, user_id)` — private helper

```python
result = await db.execute(select(Annotation).where(Annotation.annotation_id == annotation_id))
annotation = result.scalar_one_or_none()
if not annotation:
    raise HTTPException(404, "Annotation not found")
if annotation.user_id != user_id:
    raise HTTPException(403, "Forbidden")    # biết annotation tồn tại nhưng không phải của mình
return annotation
```

---

## 18. `app/routers/notifications.py`

### `GET /unread-count` → `{"count": int}`

```python
result = await db.execute(
    select(func.count()).where(
        Notification.user_id == current_user.user_id,
        Notification.is_read == False,
    )
)
count = result.scalar_one()
return {"count": count}
```

`func.count()` → `SELECT COUNT(*) ...` — hiệu quả hơn fetch toàn bộ records rồi `len()`.

### `PATCH /read-all`

```python
await db.execute(
    update(Notification)
    .where(Notification.user_id == ..., Notification.is_read == False)
    .values(is_read=True)
)
await db.commit()
```

Bulk UPDATE thay vì loop từng record — 1 SQL statement thay vì N.

### `POST /test-email` — debug endpoint

```python
async def test_daily_email(current_user, db):
    today = datetime.now(timezone.utc).date()
    luu_sao = calculate_all_tiers(today)
    date_str = today.strftime("%d/%m/%Y")
    subject = f"[TEST] YinYang — Sao lưu hôm nay {date_str}"
    html = _build_email_html(current_user.full_name or current_user.email, date_str, luu_sao)
    await _send_email(current_user.email, subject, html)
    return {"message": f"Email đã gửi đến {current_user.email}"}
```

Không tạo notification record, không check notify_channel — gửi thẳng đến user đang đăng nhập để test template.

---

## 19. `app/routers/calendar.py`

### `POST /solar-to-lunar`
```python
async def solar_to_lunar(body: {"date": "YYYY-MM-DD", "timezone_offset": int}):
    return CalendarService.solar_to_lunar(date, timezone_offset)
```
Không cần auth. Dùng trên Home page widget.

### `POST /lunar-to-solar`
```python
async def lunar_to_solar(body: {"year", "month", "day", "is_leap", "timezone_offset"}):
    return CalendarService.lunar_to_solar(...)
```

---

## 20. `app/services/auth_service.py`

### `AuthService.verify_password(plain, hashed) -> bool`
```python
if not hashed:
    return False    # OAuth users không có hashed_password — không cho đăng nhập bằng password
return verify_password(plain, hashed)
```

### `AuthService.register(db, email, password, full_name) -> User`
```python
user = User(email=email, hashed_password=hash_password(password), full_name=full_name)
db.add(user)
await db.commit()
await db.refresh(user)    # load user_id, created_at (server_default fields)
return user
```

### `AuthService.create_tokens(user_id: str) -> TokenResponse`
Wrapper gọi `create_access_token` + `create_refresh_token`.

### `AuthService.google_auth_url() -> str`
Build URL:
```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=...
  &redirect_uri=...
  &response_type=code
  &scope=openid email profile
```

### `AuthService.google_callback(db, code) -> User`

```python
# 1. Đổi authorization code lấy access token
token_resp = await httpx.post("https://oauth2.googleapis.com/token", data={
    "code": code,
    "client_id": ..., "client_secret": ...,
    "redirect_uri": ..., "grant_type": "authorization_code"
})

# 2. Lấy user info từ Google
userinfo_resp = await httpx.get("https://www.googleapis.com/oauth2/v3/userinfo",
    headers={"Authorization": f"Bearer {token_resp.json()['access_token']}"})
info = userinfo_resp.json()  # {sub: "google_id", email: "...", name: "..."}

# 3. Upsert logic (3 trường hợp):
#    a. Tìm theo google_id → user đã link Google trước đó
result = await db.execute(select(User).where(User.google_id == info["sub"]))
user = result.scalar_one_or_none()

#    b. Tìm theo email → user đã có tài khoản email/password, merge
if not user:
    result2 = await db.execute(select(User).where(User.email == info["email"]))
    user = result2.scalar_one_or_none()

#    c. Tạo mới hoàn toàn
if user:
    user.google_id = info["sub"]    # link Google ID vào existing account
else:
    user = User(email=info["email"], google_id=info["sub"])
    db.add(user)

user.last_login = datetime.utcnow()
await db.commit()
await db.refresh(user)
return user
```

### `AuthService.queue_deletion(db, user) -> None`
```python
user.is_active = False
await db.commit()
```
Soft-delete. Background job xóa data thật sau 30 ngày (chưa implement).

---

## 21. `app/services/ai_service.py`

### `_PALACE_VI` — dict
```python
{
    "命宫": "Mệnh", "兄弟": "Huynh Đệ", "夫妻": "Phu Thê",
    "子女": "Tử Tức", "财帛": "Tài Bạch", "疾厄": "Tật Ách",
    "迁移": "Thiên Di", "仆役": "Nô Bộc", "官禄": "Quan Lộc",
    "田宅": "Điền Trạch", "福德": "Phúc Đức", "父母": "Phụ Mẫu",
}
```
iztro library (zh-CN) trả tên cung bằng Hán tự. Dùng map này ở nhiều nơi: `_summarise_matrix`, `daily_horoscope._map_sao_to_palaces`, chatbot system prompt.

### `_summarise_matrix(matrix: dict) -> str`

```python
def _summarise_matrix(matrix):
    palaces = matrix.get("palaces", [])
    lines = []
    for p in palaces:
        name_cn = p.get("name", "")
        name_vi = _PALACE_VI.get(name_cn, name_cn)
        branch = p.get("earthlyBranch", "")
        major = [s.get("name") for s in p.get("majorStars", [])]
        minor = [s.get("name") for s in p.get("minorStars", []) + p.get("adjectiveStars", [])]
        decadal = p.get("decadal", {})
        age_range = decadal.get("range", [])

        line = f"  [{name_vi} / {branch}]"
        if major: line += f"  Chính tinh: {', '.join(major)}"
        if minor: line += f"  |  Phụ tinh: {', '.join(minor[:6])}"
        if age_range: line += f"  |  Đại hạn: {age_range[0]}–{age_range[1]}"
        lines.append(line)

    soul = matrix.get("soul", "")
    body = matrix.get("body", "")
    element = matrix.get("fiveElementsClass", "")
    header = f"Mệnh chủ: {soul}  |  Thân chủ: {body}  |  Cục: {element}\n"
    return header + "\n".join(lines)
```

**Output ví dụ:**
```
Mệnh chủ: Tử Vi  |  Thân chủ: Thiên Cơ  |  Cục: Thủy Nhị Cục
  [Mệnh / 寅]  Chính tinh: Tử Vi, Thiên Cơ  |  Phụ tinh: Lộc Tồn  |  Đại hạn: 2–11
  [Tài Bạch / 申]  Chính tinh: Vũ Khúc, Thiên Phủ  |  ...
  ...
```

### `_build_prompt(matrix) -> str`

Yêu cầu Gemini trả JSON 7 fields, không markdown:
```
{
  "overall": "3-4 đoạn tổng quan",
  "cung_menh": "phân tích Cung Mệnh",
  "cung_tai_bach": "phân tích Tài Bạch",
  "cung_quan_loc": "phân tích Quan Lộc",
  "cung_phu_the": "phân tích Phu Thê",
  "dai_han": "đại hạn",
  "luu_y": "lời khuyên"
}
```

### `AIService.interpret(chart_matrix) -> dict`

```python
@staticmethod
async def interpret(chart_matrix):
    if not settings.GEMINI_API_KEY:
        return _fallback()

    prompt = _build_prompt(chart_matrix)

    async with httpx.AsyncClient(timeout=60.0) as client:    # timeout 60s cho response dài
        resp = await client.post(
            f"{_GEMINI_URL}?key={GEMINI_API_KEY}",
            json={
                "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.7,       # thấp hơn = consistent hơn
                    "maxOutputTokens": 8192,  # cao vì response dài (7 fields chi tiết)
                },
            }
        )

    # Parse: bóc JSON từ markdown code fence nếu Gemini wrap
    text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())
```

**Tại sao `maxOutputTokens: 8192` cho interpretation nhưng 1500 cho horoscope?**  
Interpretation cần phân tích 7 cung chi tiết → dài. Horoscope cần ngắn gọn, actionable → 1500 tokens đủ.

### `_fallback() -> dict`
```python
return {
    "overall": "Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.",
    "cung_menh": "", "cung_tai_bach": "", "cung_quan_loc": "",
    "cung_phu_the": "", "dai_han": "", "luu_y": "",
    "_fallback": True,
}
```
Trả stub khi Gemini lỗi — app không crash, user thấy message thay vì 500.

---

## 22. `app/services/luu_sao_utils.py`

### Lookup Tables

```python
_CAN = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"]  # index 0–9
_CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"]  # index 0–11

_CHI_TO_HOUSE = {"Tỵ":1,"Ngọ":2,"Mùi":3,"Thân":4,"Dậu":5,"Tuất":6,
                 "Hợi":7,"Tý":8,"Sửu":9,"Dần":10,"Mão":11,"Thìn":12}
# Mapping Chi → house number theo chuẩn BRANCH_ORDER iztro:
# 巳(Tỵ)=1, 午(Ngọ)=2, ..., 辰(Thìn)=12
# Dùng để cross-reference với chart_matrix của iztro

_LOC_BY_CAN = {
    "Giáp":"Dần","Ất":"Mão","Bính":"Tỵ","Đinh":"Ngọ",
    "Mậu":"Tỵ","Kỷ":"Ngọ","Canh":"Thân","Tân":"Dậu","Nhâm":"Hợi","Quý":"Tý"
}
# Lộc Tồn an theo nguyên tắc: Giáp Lộc tại Dần, Ất Lộc tại Mão, ...

_THIEN_MA_BY_CHI = {
    "Thân":"Dần","Tý":"Dần","Thìn":"Dần",     # nhóm Tứ Xung Thân-Tý-Thìn → Mã tại Dần
    "Dần":"Thân","Ngọ":"Thân","Tuất":"Thân",   # nhóm Dần-Ngọ-Tuất → Mã tại Thân
    "Tỵ":"Hợi","Dậu":"Hợi","Sửu":"Hợi",       # nhóm Tỵ-Dậu-Sửu → Mã tại Hợi
    "Hợi":"Tỵ","Mão":"Tỵ","Mùi":"Tỵ",         # nhóm Hợi-Mão-Mùi → Mã tại Tỵ
}
# 4 tam hợp cục: mỗi cục có Thiên Mã đóng ở cung đối

_TU_HOA_BY_CAN = {
    "Giáp": ("Liêm Trinh","Phá Quân","Vũ Khúc","Thái Dương"),  # Lộc, Quyền, Khoa, Kỵ
    "Ất":   ("Thiên Cơ","Thiên Lương","Tử Vi","Thái Âm"),
    "Bính": ("Thiên Đồng","Thiên Cơ","Văn Xương","Liêm Trinh"),
    "Đinh": ("Thái Âm","Thiên Đồng","Thiên Cơ","Cự Môn"),
    "Mậu":  ("Tham Lang","Thái Âm","Hữu Bật","Thiên Cơ"),
    "Kỷ":   ("Vũ Khúc","Tham Lang","Thiên Lương","Văn Khúc"),
    "Canh": ("Thái Dương","Vũ Khúc","Thái Âm","Thiên Đồng"),
    "Tân":  ("Cự Môn","Thái Dương","Văn Khúc","Văn Xương"),
    "Nhâm": ("Thiên Lương","Tử Vi","Tả Phụ","Vũ Khúc"),
    "Quý":  ("Phá Quân","Cự Môn","Thái Âm","Tham Lang"),
}
# Phi Tinh Tứ Hóa — bảng chuẩn trong Tử Vi Đẩu Số

_2026_MONTH_STARTS = [
    date(2026,2,17), date(2026,3,18), date(2026,4,17), date(2026,5,17),
    date(2026,6,15), date(2026,7,15), date(2026,8,13), date(2026,9,12),
    date(2026,10,11), date(2026,11,10), date(2026,12,9), date(2027,1,7),
]
# Ngày dương lịch bắt đầu mỗi tháng âm lịch năm 2026 (Bính Ngọ)
# Tháng 12 âm lịch kéo dài đến 2027 nên entry cuối là date(2027,1,7)
```

### `_jdn(y, m, d) -> int` — Julian Day Number

```python
def _jdn(y, m, d):
    a = (14 - m) // 12       # = 1 nếu tháng 1 hoặc 2, = 0 nếu tháng 3–12
    yy = y + 4800 - a         # điều chỉnh năm để tháng 1-2 thuộc năm trước
    mm = m + 12*a - 3         # normalize tháng về 0–11
    return d + (153*mm+2)//5 + 365*yy + yy//4 - yy//100 + yy//400 - 32045
```
Proleptic Gregorian calendar algorithm (Jean Meeus). Nhanh hơn `datetime` → số học thuần túy.

**Xác minh:**
- `_jdn(2024,1,1) = 2460310`. `(2460310 + 49) % 60 = 59`. `59%10=9` → Quý. `59%12=11` → Hợi. **Ngày Quý Hợi ✓**
- `_jdn(2026,5,30) = 2461211`. `(2461211 + 49) % 60 = 0`. `0%10=0` → Giáp. `0%12=0` → Tý. **Ngày Giáp Tý**

### `_can_chi_of_date(d) -> tuple(can, chi)`
```python
pos = (_jdn(d.year, d.month, d.day) + 49) % 60
return _CAN[pos % 10], _CHI[pos % 12]
```
Tại sao `+49`? Offset để `pos=0` ứng với Giáp Tý (đầu chu kỳ 60). Giá trị 49 được chọn sao cho formula khớp với lịch vạn niên chuẩn.

### `_chi_shift(chi, n) -> str`
```python
return _CHI[(_CHI.index(chi) + n) % 12]
```
Dịch chi theo vòng tròn 12. `n=+1` → chi tiếp theo, `n=-1` → chi trước.

### `_year_can_chi(year) -> tuple`
```python
can = _CAN[(year % 10 + 6) % 10]
chi = _CHI[(year % 12 + 8) % 12]
```
**Xác minh 2026:** `(2026%10+6)%10 = (6+6)%10 = 2` → Bính. `(2026%12+8)%12 = (10+8)%12 = 6` → Ngọ. **2026 = Bính Ngọ ✓**

### `_month_can_chi(year, lunar_month) -> tuple`
```python
year_can_idx = (year % 10 + 6) % 10
month_can_start = (year_can_idx * 2 + 2) % 10   # Can tháng 1 âm lịch
can = _CAN[(month_can_start + lunar_month - 1) % 10]
chi = _CHI[(2 + lunar_month - 1) % 12]   # tháng 1 âm lịch = Dần (index 2)
```
**Quy tắc:** Tháng 1 âm lịch năm Giáp/Kỷ bắt đầu bằng Bính Dần. Năm Bính: `(2*2+2)%10 = 6` → Canh. Tháng 1 âm 2026 = Canh Dần.

### `_build_star_block(prefix, can, chi) -> dict`

Core function tính tất cả sao từ Can Chi:

```python
def _build_star_block(prefix, can, chi):
    loc  = _LOC_BY_CAN[can]           # tra bảng Can → Chi Lộc Tồn
    kinh = _chi_shift(loc, +1)         # Kình Dương = Lộc + 1
    da   = _chi_shift(loc, -1)         # Đà La = Lộc - 1
    ma   = _THIEN_MA_BY_CHI[chi]       # Thiên Mã tra bảng theo Chi
    tang = _chi_shift(chi, +2)         # Tang Môn = Chi + 2
    bach = _chi_shift(chi, +6)         # Bạch Hổ = Chi + 6
    tu_hoa = _TU_HOA_BY_CAN[can]       # tuple(Lộc, Quyền, Khoa, Kỵ)

    return {
        "can": can, "chi": chi,
        f"{prefix} Lộc Tồn":   {"chi": loc,  "house": _CHI_TO_HOUSE[loc]},
        f"{prefix} Kình Dương": {"chi": kinh, "house": _CHI_TO_HOUSE[kinh]},
        f"{prefix} Đà La":      {"chi": da,   "house": _CHI_TO_HOUSE[da]},
        f"{prefix} Thiên Mã":   {"chi": ma,   "house": _CHI_TO_HOUSE[ma]},
        f"{prefix} Thái Tuế":   {"chi": chi,  "house": _CHI_TO_HOUSE[chi]},   # Thái Tuế = Chi ngày/tháng/năm
        f"{prefix} Tang Môn":   {"chi": tang, "house": _CHI_TO_HOUSE[tang]},
        f"{prefix} Bạch Hổ":    {"chi": bach, "house": _CHI_TO_HOUSE[bach]},
        "tu_hoa": {
            tu_hoa[0]: "Hóa Lộc",
            tu_hoa[1]: "Hóa Quyền",
            tu_hoa[2]: "Hóa Khoa",
            tu_hoa[3]: "Hóa Kỵ",
        },
    }
```

**Tại sao Thái Tuế = Chi ngày/tháng/năm?** Thái Tuế luôn an tại Chi của thời gian đang tính (Chi ngày cho Lưu Nhật, Chi năm cho Lưu Niên). Đây là quy tắc cổ học Tử Vi.

**Tại sao Tang Môn = Chi + 2, Bạch Hổ = Chi + 6?** Tang Môn (sao tang chế) an cách Thái Tuế 2 cung. Bạch Hổ (sao sát) an đối xung với Tang Môn (6 = nửa vòng 12).

### `calculate_luu_nhat(d: date) -> dict`
```python
can, chi = _can_chi_of_date(d)
return _build_star_block("Lưu Nhật", can, chi)
```

### `calculate_luu_nien(year: int) -> dict`
```python
can, chi = _year_can_chi(year)
block = _build_star_block("Lưu Niên", can, chi)
block["year"] = year
return block
```

### `calculate_luu_nguyet(d: date) -> dict`

```python
if d.year != 2026:
    return {"placeholder": True, "message": f"Sao Lưu Nguyệt năm {d.year} chưa được tính..."}

lm = _get_lunar_month_2026(d)
if lm is None:
    return {"placeholder": True, "message": "Ngày này nằm trước Tết Bính Ngọ..."}

can, chi = _month_can_chi(2026, lm)
block = _build_star_block("Lưu Nguyệt", can, chi)
block["year"] = 2026
block["lunar_month"] = lm
return block
```

Frontend `TierCard` kiểm tra `tier.placeholder === true` để hiển thị message thay vì danh sách sao.

### `calculate_all_tiers(d: date) -> dict`
```python
return {
    "luu_nhat":   calculate_luu_nhat(d),
    "luu_nguyet": calculate_luu_nguyet(d),
    "luu_nien":   calculate_luu_nien(d.year),
}
```
Entry point duy nhất. Được gọi từ: `journal.py`, `daily_horoscope.py`, `notification_service.py`.

---

## 23. `app/services/notification_service.py`

### `NotificationService.recalculate_luu_sao(db, user_id) -> dict`
```python
today = datetime.now(timezone.utc).date()
luu_sao = calculate_all_tiers(today)

result = await db.execute(
    select(JournalLog).where(
        JournalLog.user_id == user_id,
        JournalLog.log_date == today,
    )
)
log = result.scalar_one_or_none()

if log:
    log.luu_sao_positions = luu_sao    # update nếu đã có entry
else:
    log = JournalLog(user_id=user_id, log_date=today, luu_sao_positions=luu_sao)
    db.add(log)                        # tạo entry mới với luu_sao nhưng content=None

await db.commit()
return {"log_date": today.isoformat(), "luu_sao_positions": luu_sao}
```

### `NotificationService.send_daily_horoscope_emails(db) -> int`

```python
# 1. Load tất cả user active
all_users = (await db.execute(select(User).where(User.is_active == True))).scalars().all()

# 2. Tính sao lưu MỘT LẦN cho tất cả (cùng ngày)
today = datetime.now(timezone.utc).date()
luu_sao = calculate_all_tiers(today)

# 3. Build preview text cho in-app notification
nhat = luu_sao["luu_nhat"]
stars_preview = ", ".join(s_name for s_key, s_val in nhat.items()
                           if isinstance(s_val, dict) and "house" in s_val
                           for s_name in [s_key])[:3]   # tên 3 sao đầu
notif_body = f"Ngày {nhat['can']} {nhat['chi']} — {stars_preview}"

sent = 0
for user in all_users:
    # 4. Tạo in-app notification cho TẤT CẢ user
    db.add(Notification(
        user_id=user.user_id,
        title=f"Sao lưu hôm nay · {date_str}",
        body=notif_body,
        notif_type="luu_sao",
    ))

    # 5. Gửi email chỉ với user opt-in
    if user.notify_channel in ("email", "both"):
        html = _build_email_html(user.full_name or user.email, date_str, luu_sao)
        try:
            await _send_email(user.email, subject, html)
            sent += 1
        except Exception:
            pass    # không abort batch vì 1 email lỗi

await db.commit()    # commit TẤT CẢ notifications trong 1 transaction
return sent
```

### `_send_email(to, subject, html_body)` — private async

```python
async def _send_email(to, subject, html_body):
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return    # silently skip nếu chưa configure

    from_addr = settings.SMTP_FROM or settings.SMTP_USER   # alias nếu có

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"YinYang Astrology <{from_addr}>"
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,   # smtp.gmail.com
        port=settings.SMTP_PORT,        # 587
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD.replace(" ", ""),   # strip spaces từ App Password format
        start_tls=True,                 # STARTTLS: bắt đầu plaintext, upgrade lên TLS
    )
```

**STARTTLS vs SSL:** Port 587 dùng STARTTLS (upgrade mid-connection). Port 465 dùng SSL ngay từ đầu (SMTPS). Gmail hỗ trợ cả hai; 587+STARTTLS là chuẩn RFC khuyến nghị.

**`.replace(" ", "")`:** Google hiển thị App Password dạng "xxxx xxxx xxxx xxxx" với spaces, nhưng thực tế là 16 ký tự liền. Strip để tránh auth failure.

### `_build_email_html(name, date_str, luu_sao) -> str`

Template HTML với:
- **Header:** gradient `#2d1b4e → #1a0d35`, chữ "YinYang" màu `#edb1ff`
- **Greeting:** "Chào {name}," + mô tả ngày
- **3 sections:** Lưu Nhật / Nguyệt / Niên — mỗi section là HTML `<table>` với:
  - Icon + màu riêng per sao (từ `_STAR_META`)
  - Column: tên sao | house số
  - Tứ Hóa chips màu
- **CTA button:** "Viết nhật ký hôm nay" → `/journal`
- **Footer:** link `/profile` để manage notification settings

### `_star_style(star_name) -> tuple(emoji, color)`
```python
_STAR_META = {
    "Lộc Tồn":   {"icon": "💰", "color": "#4ade80"},  # xanh lá
    "Kình Dương": {"icon": "⚔",  "color": "#f87171"},  # đỏ
    "Đà La":      {"icon": "🌑", "color": "#a78bfa"},  # tím
    "Thiên Mã":   {"icon": "🐎", "color": "#67e8f9"},  # cyan
    "Thái Tuế":   {"icon": "☀",  "color": "#fbbf24"},  # vàng
    "Tang Môn":   {"icon": "🪦", "color": "#94a3b8"},  # xám
    "Bạch Hổ":    {"icon": "🐯", "color": "#fb923c"},  # cam
}
# Tìm key nào là substring của star_name
for key, meta in _STAR_META.items():
    if key in star_name:    # "Lộc Tồn" in "Lưu Nhật Lộc Tồn" → True
        return meta["icon"], meta["color"]
return "✦", "#c4b5fd"    # fallback
```

---

## 24. `app/services/calendar_service.py`

Tính lịch âm lịch thiên văn Việt Nam. Hợp lệ 1900–2100.

### `_solar_to_jd(dd, mm, yy) -> float`
Gregorian → Julian Day Number. Dùng trong tất cả tính toán thiên văn.

### `_jd_to_solar(jd) -> tuple(day, month, year)`
JDN → ngày dương lịch.

### `_new_moon(k) -> float`
JDN của kỳ trăng mới thứ `k` (k=0 là trăng mới đầu năm 2000). Dùng công thức Jean Meeus "Astronomical Algorithms". Trung bình 29.5306 ngày/tháng âm.

### `_sun_longitude(jd, tz) -> float`
Kinh độ Mặt Trời (0°–360°) tại JDN, theo timezone. Mỗi 30° = 1 "tiết khí" (solar term). Dùng để tìm Đông Chí (270°) và tháng nhuận.

### `_get_lunar_month_11(yy, tz) -> float`
JDN của đầu tháng 11 âm lịch năm `yy`. Tháng 11 là tháng chứa Đông Chí (kinh độ MT = 270°). Đây là mốc anchor để đếm các tháng âm lịch.

### `_find_leap_month(a11, tz) -> int`
Năm nhuận có 13 tháng âm lịch (thêm 1 tháng nhuận). Tháng nhuận là tháng không có "trung khí" (multiple of 30°). Return index của tháng nhuận (0–11) hoặc -1.

### `_jd_to_lunar(jd, tz) -> dict`
```python
# 1. Tìm tháng 11 của 2 năm liên tiếp
a11 = _get_lunar_month_11(year, tz)
b11 = _get_lunar_month_11(year+1, tz)

# 2. Đếm số kỳ trăng mới giữa a11 và b11
# Nếu >= 13 → năm nhuận

# 3. Tìm tháng nhuận
leap = _find_leap_month(a11, tz)

# 4. Map JDN vào tháng âm lịch
# Return: {year, month, day, is_leap_month}
```

### `CalendarService.solar_to_lunar(solar_date, timezone_offset) -> dict`
```python
# solar_date: "YYYY-MM-DD"
# return: {"year": 2026, "month": 4, "day": 14, "is_leap_month": False}
```

### `CalendarService.lunar_to_solar(lunar_year, month, day, is_leap, tz) -> dict`
```python
# return: {"solar_date": "2026-05-30"}
```

---

## 25. `app/services/chart_engine.py`

### `ChartEngine.solar_to_lunar(solar_date, tz) -> dict`
Delegate sang `CalendarService.solar_to_lunar`.

### `ChartEngine.calculate(lunar, birth_hour, gender) -> dict`
Server-side chart calculation (14 chính tinh + 45+ phụ tinh). **Trong thực tế, iztro chạy ở browser** và gửi kết quả lên. Backend `ChartEngine` dùng cho các feature server-side như compare.

### `ChartEngine.compare(matrix_a, matrix_b, view) -> dict`
So sánh 2 lá số. `view="side_by_side"` hoặc `"merged"`. Return `compatibility_score` (0.0–1.0) dựa trên overlap sao.

---

## 26. `app/tasks/celery_app.py`

```python
celery_app = Celery(
    "tuvi",
    broker=settings.REDIS_URL,    # Redis làm message broker (task queue)
    backend=settings.REDIS_URL,   # Redis lưu kết quả task
    include=["app.tasks.jobs"],    # module chứa task definitions
)

celery_app.conf.timezone = "Asia/Ho_Chi_Minh"
celery_app.conf.broker_connection_retry_on_startup = True  # retry nếu Redis chưa sẵn sàng

celery_app.conf.beat_schedule = {
    "daily-luu-sao-recalculation": {
        "task": "app.tasks.jobs.recalculate_luu_sao_all_users",
        "schedule": crontab(hour=0, minute=5),   # 00:05 ICT hàng ngày
    },
    "daily-horoscope-email": {
        "task": "app.tasks.jobs.send_daily_horoscope_emails",
        "schedule": crontab(hour=7, minute=0),   # 07:00 ICT hàng ngày
    },
}
```

**Tại sao Redis làm cả broker và backend?** Đơn giản hóa infrastructure — không cần RabbitMQ riêng. Với scale nhỏ-vừa, Redis đủ tốt làm cả hai vai trò.

**`timezone = "Asia/Ho_Chi_Minh"`:** Celery beat dùng timezone này để interpret crontab. `hour=7` = 07:00 ICT (UTC+7).

---

## 27. `app/tasks/jobs.py`

### `_run(coro)` — sync wrapper

```python
def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)
```
Celery tasks là **synchronous** (chạy trong thread pool). Service layer của app là **async**. `_run` bridge giữa hai thế giới: wrap coroutine trong event loop để chạy synchronously.

### `send_daily_horoscope_emails` task

```python
@celery_app.task(name="app.tasks.jobs.send_daily_horoscope_emails", bind=True, max_retries=3)
def send_daily_horoscope_emails(self):
    async def _inner():
        # Tạo async DB session riêng cho Celery worker (process riêng biệt với FastAPI)
        engine = create_async_engine(settings.DATABASE_URL)
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with Session() as db:
            count = await NotificationService.send_daily_horoscope_emails(db)
            return count

    try:
        count = _run(_inner())
        return {"emails_sent": count}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * 5)    # retry sau 5 phút
```

**`bind=True`:** Task có access `self` → gọi `self.retry()`.  
**`max_retries=3`:** Fail 3 lần liên tiếp → task mark failed, không retry nữa.  
**Tại sao tạo engine riêng?** Celery worker là process riêng, không share SQLAlchemy engine với FastAPI process. Cần tạo connection pool mới.

### `recalculate_luu_sao_all_users` task

```python
@celery_app.task(name="app.tasks.jobs.recalculate_luu_sao_all_users", bind=True, max_retries=3)
def recalculate_luu_sao_all_users(self):
    # Tương tự pattern trên
    # Gọi NotificationService.daily_recalculate_all(db)
    # Return {"recalculated": count}
    # retry sau 5 phút nếu fail
```

---

## 28. Alembic Migrations

**Location:** `backend/alembic/`  
**Auto-run:** `start.sh` chạy `alembic upgrade head` trước khi start uvicorn.

### Migration Chain (theo thứ tự)

```
5ee7f6aca042_init
    └── a1b2c3d4e5f6 — add_full_name_to_users
            └── b3c4d5e6f7a8 — drop_roles_and_configurations
                    └── c5d6e7f8a9b0 — add_notifications_table  ← HEAD
```

### Tạo migration mới

```bash
cd backend
alembic revision --autogenerate -m "mô tả ngắn"
# Sửa file vừa tạo:
# down_revision = "c5d6e7f8a9b0"   ← phải là HEAD hiện tại
# Kiểm tra upgrade()/downgrade() được auto-generate đúng
alembic upgrade head
```

### `add_notifications_table.py` — migration mới nhất

```python
revision = "c5d6e7f8a9b0"
down_revision = "b3c4d5e6f7a8"

def upgrade():
    op.create_table("notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("notif_type", sa.String(50), nullable=False, server_default="info"),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])

def downgrade():
    op.drop_index("ix_notifications_user_id")
    op.drop_table("notifications")
```

---

## 29. Environment Variables

| Variable | Required | Default | Mô tả |
|----------|----------|---------|-------|
| `DATABASE_URL` | ✅ | — | `postgresql+asyncpg://user:pass@host:5432/db` |
| `REDIS_URL` | ✅ | — | `redis://host:6379/0` |
| `SECRET_KEY` | ✅ | — | JWT signing key. Tạo: `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `FIELD_ENCRYPTION_KEY` | ✅ | — | 64-char hex (32 bytes AES-256). Tạo: `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `ALGORITHM` | | HS256 | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | | 60 | |
| `REFRESH_TOKEN_EXPIRE_DAYS` | | 30 | |
| `GEMINI_API_KEY` | AI | "" | Google Gemini. Thiếu → horoscope/chat trả 503 |
| `GOOGLE_CLIENT_ID` | OAuth | "" | |
| `GOOGLE_CLIENT_SECRET` | OAuth | "" | |
| `GOOGLE_REDIRECT_URI` | OAuth | localhost | `https://domain/api/v1/auth/google/callback` |
| `ALLOWED_ORIGINS` | ✅ | localhost | JSON array: `["https://yinyang.io.vn"]` |
| `FRONTEND_URL` | ✅ | localhost | Dùng trong OAuth redirect sau callback |
| `DEBUG` | | False | `true` → print SQL, verbose |
| `DOCS_USERNAME` | Prod | "" | Basic auth user cho /api/docs. Trống = no auth |
| `DOCS_PASSWORD` | Prod | "" | Basic auth password |
| `SMTP_HOST` | Email | smtp.gmail.com | |
| `SMTP_PORT` | Email | 587 | STARTTLS port |
| `SMTP_USER` | Email | "" | Gmail account xác thực. Trống → skip email |
| `SMTP_PASSWORD` | Email | "" | Gmail App Password (16 ký tự, spaces tự strip) |
| `SMTP_FROM` | Email | "" | From address (alias). Fallback = SMTP_USER |
| `RATE_LIMIT_REQUESTS` | | 100 | Max requests per window |
| `RATE_LIMIT_WINDOW_SECONDS` | | 60 | Window size (giây) |
