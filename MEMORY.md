---
name: YinYang — Tử Vi Platform Project Context
description: Current state of the Vietnamese astrology web platform — implemented features, stack, key decisions, and what's pending
type: project
---

# YinYang — Tử Vi Platform

## Stack
- **Backend:** FastAPI + PostgreSQL + Redis + Celery + Alembic
- **Frontend:** React (Vite) + iztro library + react-router-dom
- **AI:** Google Gemini
- **Email:** aiosmtplib + Google SMTP (smtp.gmail.com:587, STARTTLS)
- **Production:** https://yinyang.io.vn · Docker Compose
- **Deployment:** `docker compose up -d --build` · migrations auto-run via `start.sh`

## Implemented Features (as of 2026-05-30)

### Backend
- Auth: email/password + Google OAuth, JWT (access 60min / refresh 30d), soft-delete
- User profile: PATCH `/me` (name, notify_channel), PUT `/me/password`, `has_password` flag
- Charts: save (AES-256 encrypted birth data), list, get, delete, AI interpretation (Gemini, cached in DB)
- AI Chatbot: multi-turn with user's chart in system prompt
- Calendar: solar↔lunar conversion
- Annotations: per-chart notes pinned to palace/star
- Journal: daily log with auto Lưu Sao calculation, `GET /stars` endpoint
- Daily Horoscope: personalized (requires saved chart), cross-references Lưu Nhật with natal palaces, Redis-cached until midnight, `sao_nhat` field in response
- Lưu Sao: `luu_sao_utils.py` — Lưu Nhật (JDN formula), Nguyệt (2026 real data), Niên; Tứ Hóa via Can
- Notifications (in-app): `notifications` table, list/unread-count/mark-read endpoints
- Notifications (email): aiosmtplib SMTP, HTML email with colored star table, sent at 07:00 ICT via Celery
- API docs: HTTP Basic Auth protection (DOCS_USERNAME/DOCS_PASSWORD env)
- Rate limiting: sliding window Redis, 100 req/60s

### Frontend
- Pages: Home, Login, SignUp, LaSoTuVi (chart + annotations), DailyHoroscope, Journal, Chatbot, MajorStars, Profile, AuthCallback
- Shared Header (Logo image `/favicon3.png` + "YinYang" in Cinzel font) across ALL pages
- NotificationBell component: badge, dropdown, mark-read, 60s poll — in ALL navbars
- Avatar initials → `/profile` in ALL navbars (no "Hồ Sơ" text link)
- Profile page: edit name, notify channel, change password (hidden for OAuth), delete account

## Key Technical Decisions
- iztro runs in browser; backend stores `chart_matrix` JSONB result
- Lưu Nguyệt: hardcoded 2026 real lunar month starts; other years return `{placeholder: true}`
- Cache key versioning: `horoscope:v3:{user_id}:{date}` — bump version to invalidate
- `/journal/stars` placed BEFORE `/{log_date}` to avoid FastAPI route conflict
- `from __future__ import annotations` + `Optional` for Python 3.9 compatibility
- SMTP_PASSWORD spaces stripped automatically in `_send_email`
- `SMTP_FROM` = alias address; `SMTP_USER` = Gmail account for auth

## Pending / Not Yet Built
- Lịch tốt/xấu theo tháng
- Đại hạn / Tiểu hạn
- Lưu nhiều lá số per user
- Chia sẻ lá số (public read-only link)
- Web Push (PWA / Service Worker)
- Trang 12 con giáp (nav link exists, page not built)
- PDF export UI (backend reportlab exists, no frontend trigger)
- Streak logic (column exists, no increment logic)
- Full-text journal search
- So sánh / hợp tuổi 2 lá số

## DB Migration Chain
`5ee7f6aca042_init` → `add_full_name_to_users (a1b2c3d4e5f6)` → `drop_roles_and_configurations (b3c4d5e6f7a8)` → `add_notifications_table (c5d6e7f8a9b0)`

**Why:** This is the living state document. All API design, migration decisions, and pending work should be checked here first.

**How to apply:** Before starting a new feature, check Pending list. Before creating a migration, verify the latest revision ID in the chain above.
