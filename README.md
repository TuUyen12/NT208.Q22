# YinYang — Ứng Dụng Tử Vi Trực Tuyến

> **NT208.Q22 — Production Release**  
> Website: https://yinyang.io.vn

Ứng dụng tra cứu và luận giải **Tử Vi**, **Lá Số**, **Tử Bình** kết hợp AI — được xây dựng với React (Frontend) và FastAPI (Backend), triển khai bằng Docker.

---

## Mục Lục

- [Tính Năng](#tính-năng)
- [Kiến Trúc](#kiến-trúc)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt & Chạy](#cài-đặt--chạy)
- [Biến Môi Trường](#biến-môi-trường)
- [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
- [API Endpoints](#api-endpoints)
- [CI/CD](#cicd)
- [Monitoring](#monitoring)

---

## Tính Năng

- **Lá Số Tử Vi**: Tính và hiển thị lá số tử vi theo ngày, tháng, năm, giờ sinh.
- **Lưu Sao / Đại Vận / Tiểu Vận**: Tính toán tự động, cập nhật định kỳ mỗi ngày.
- **Tử Hình Nhật / Ngày Tốt Xấu**: Xem tử hình nhật và các ngày tốt xấu theo lịch âm.
- **Luận Giải AI**: Giải thích lá số bằng AI (tích hợp Anthropic Claude / Gemini).
- **Chatbot Tử Vi**: Hỏi đáp về tử vi và phong thủy với chatbot AI.
- **Nhật Ký Cá Nhân**: Ghi chép nhật ký kết hợp với lá số cá nhân.
- **Chú Thích Lá Số**: Thêm ghi chú, chú thích trực tiếp lên các cung trong lá số.
- **Thông Báo Hàng Ngày**: Gửi email tử vi mỗi sáng (07:00 ICT) qua Celery Beat.
- **Lịch Âm Dương**: Xem và tra cứu lịch âm dương.
- **Đăng Nhập Google / Facebook**: OAuth2 tích hợp.
- **Bảo Mật**: JWT, AES-256 mã hóa thông tin nhạy cảm, rate limiting, CORS.

---

## Kiến Trúc

```
Browser (React + iztro)
       │  HTTPS REST JSON /api/v1/…
       ▼
  Nginx :80 / :4173
       │
       ▼
  FastAPI :8000 (uvicorn ASGI)
       │
       ├── PostgreSQL 16   (asyncpg — async queries)
       ├── Redis 7         (rate-limit sliding window + horoscope cache)
       └── Celery
             ├── worker    (xử lý tác vụ nền)
             └── beat      (lịch cron)
                   ├── 00:05 ICT → recalculate_luu_sao_all_users
                   └── 07:00 ICT → send_daily_horoscope_emails
```

**Luồng request:**
```
Request → HTTPBearer → decode JWT → get_current_user (DB)
       → rate_limit (Redis) → router handler → JSON response
```

---

## Công Nghệ Sử Dụng

### Frontend
| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| React | 19.x | UI framework |
| Vite | 7.x | Build tool |
| iztro / react-iztro | 2.5.x / 1.4.x | Tính toán & hiển thị lá số Tử Vi |
| lunar-javascript / solarlunar | — | Chuyển đổi âm dương lịch |
| react-router-dom | 7.x | Routing |
| Tailwind CSS | 4.x | Styling |
| html2canvas | — | Xuất ảnh lá số |

### Backend
| Thư viện | Mục đích |
|---|---|
| FastAPI 0.115 | Web framework (async) |
| SQLAlchemy 2.0 + asyncpg | ORM async + PostgreSQL driver |
| Alembic | Database migrations |
| Pydantic v2 | Validation & settings |
| python-jose | JWT |
| bcrypt | Password hashing |
| redis[asyncio] | Rate limiting + cache |
| Celery + redis | Background tasks & scheduler |
| aiosmtplib | Gửi email async (SMTP) |
| reportlab | Xuất PDF lá số |
| cryptography (AES-256) | Mã hóa thông tin nhạy cảm |
| Prometheus + Grafana | Monitoring |

---

## Yêu Cầu Hệ Thống

- **Docker** ≥ 24 và **Docker Compose** ≥ 2.20
- (Tùy chọn) Node.js 20+ và Python 3.12+ để phát triển local không dùng Docker

---

## Cài Đặt & Chạy

### 1. Clone repo

```bash
git clone <repo-url>
cd NT208.Q22-prod
```

### 2. Tạo file `.env`

```bash
cp backend/.env.example .env
```

Điền đầy đủ các giá trị bắt buộc (xem mục [Biến Môi Trường](#biến-môi-trường)).

### 3. Khởi động bằng Docker Compose

```bash
docker compose up -d
```

Các service sẽ khởi động theo thứ tự: `db` → `redis` → `api` (kèm migrate DB) → `worker` → `beat` → `frontend`.

### 4. Truy cập

| Service | URL |
|---|---|
| Frontend | http://localhost:4173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/api/docs |
| API Docs (ReDoc) | http://localhost:8000/api/redoc |
| Health check | http://localhost:8000/health |
| Metrics (Prometheus) | http://localhost:8000/api/metrics |

### 5. Phát triển local (không Docker)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
# Cần có PostgreSQL và Redis chạy sẵn
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd Frontend
npm install
npm run dev
```

---

## Biến Môi Trường

Tạo file `.env` ở thư mục gốc từ `backend/.env.example`. Các biến bắt buộc:

| Biến | Mô tả |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (asyncpg) |
| `REDIS_URL` | Redis URL |
| `SECRET_KEY` | JWT secret key (chuỗi ngẫu nhiên dài) |
| `FIELD_ENCRYPTION_KEY` | AES-256 key 32-byte hex — sinh bằng `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth2 Google |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | OAuth2 Facebook |
| `AI_SERVICE_API_KEY` | API key cho Anthropic Claude |
| `GEMINI_API_KEY` | API key cho Google Gemini |
| `SMTP_USER` / `SMTP_PASSWORD` | Gmail App Password để gửi email |
| `ALLOWED_ORIGINS` | Danh sách origins cho CORS (JSON array) |

> ⚠️ **Không commit file `.env` lên git!**

---

## Cấu Trúc Thư Mục

```
NT208.Q22-prod/
├── Frontend/                   # React + Vite app
│   ├── src/
│   │   ├── pages/              # Các trang chính (Home, LaSoTuVi, Chatbot, ...)
│   │   ├── components/         # Component tái sử dụng
│   │   ├── services/           # Gọi API backend
│   │   ├── contexts/           # React Context (AuthContext)
│   │   └── hooks/              # Custom hooks
│   ├── public/                 # Static assets
│   ├── Dockerfile
│   └── package.json
│
├── backend/                    # FastAPI app
│   ├── app/
│   │   ├── main.py             # FastAPI app, middleware, router registration
│   │   ├── database.py         # Async SQLAlchemy engine
│   │   ├── dependencies.py     # DI (get_current_user, ...)
│   │   ├── core/               # Config, security, encryption, rate limit
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── routers/            # API route handlers
│   │   ├── services/           # Business logic
│   │   └── tasks/              # Celery app & jobs
│   ├── alembic/                # DB migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── start.sh                # alembic upgrade head + uvicorn
│
├── monitoring/                 # Prometheus + Loki + Promtail + Grafana
├── .github/workflows/          # GitHub Actions CI/CD
├── docker-compose.yml
└── .env.example
```

---

## API Endpoints

Tất cả các route (trừ `/health` và auth) đều yêu cầu **Bearer token** và chịu **rate limit** (mặc định 100 req/60s).

| Prefix | Module | Mô tả |
|---|---|---|
| `/api/v1/auth` | auth | Đăng ký, đăng nhập, refresh token, OAuth Google/Facebook |
| `/api/v1/charts` | charts | CRUD lá số Tử Vi |
| `/api/v1/ai` | ai_interpretation | Luận giải lá số bằng AI |
| `/api/v1/chat` | chat | Chatbot hỏi đáp tử vi |
| `/api/v1/daily-horoscope` | daily_horoscope | Tử hình nhật, ngày tốt xấu |
| `/api/v1/journal` | journal | Nhật ký cá nhân |
| `/api/v1/annotations` | annotations | Chú thích cung lá số |
| `/api/v1/notifications` | notifications | Quản lý thông báo |
| `/api/v1/calendar` | calendar | Lịch âm dương |
| `/health` | — | Health check |
| `/api/metrics` | — | Prometheus metrics |

Xem chi tiết tại `/api/docs` (Swagger UI) hoặc `/api/redoc`.

---

## CI/CD

GitHub Actions tự động kích hoạt khi push lên nhánh `main` hoặc `prod`:

1. **Frontend job**: `npm ci` → `eslint` → `vite build`
2. **Backend job**: `pip install ruff` → `ruff check`
3. **Deploy job** (chỉ nhánh `prod`):
   - Backup PostgreSQL
   - Build lại Docker images
   - `docker compose up -d --remove-orphans`
   - Chờ health check pass

Runner: **self-hosted** (deploy thẳng lên VM production).

---

## Monitoring

Stack monitoring riêng biệt tại thư mục `monitoring/`:

```bash
cd monitoring
docker compose up -d
```

| Service | Mô tả |
|---|---|
| Prometheus | Thu thập metrics từ `/api/metrics` |
| Loki | Tập hợp logs |
| Promtail | Đẩy logs vào Loki |
| Grafana | Dashboard trực quan |

---

## Demo & Tài Nguyên

| Tài nguyên | Đường dẫn |
|---|---|
| 🎬 Video demo | [Video demo - Google Drive](https://drive.google.com/drive/folders/13HpX7TLNb1CJt57NfDfHyrG9qSR9zM2a) |
| 👥 Video khảo sát người dùng | [Video khảo sát user - Google Drive](https://drive.google.com/drive/u/0/folders/1ADrEqqJfjyYODC8aOybmXVK2gLukK_uX?hl=en) |

---

## Thành Viên & Tỉ Lệ Đóng Góp

Dự án môn học **NT208 — Kỹ thuật Phần mềm Hướng Dịch vụ**, nhóm Q22.

| MSSV | Họ và Tên | Vai Trò | Đóng Góp |
|---|---|---|---|
| 24521563 | Vũ Lê Phát Tài | Nhóm Trưởng | 25% |
| 22520513 | Nguyễn Duy Hùng | Thành viên | 25% |
| 22521537 | Mai Kim Trinh | Thành viên | 25% |
| 22521638 | Lê Thị Tú Uyên | Thành viên | 25% |
---
Chúng em đã biết làm web và hiểu hệ thống web hoạt động như thế nào.
