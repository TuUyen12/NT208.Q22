---
name: Tử Vi Platform — FastAPI Backend Project
description: Full context of the Vietnamese astrology web platform backend: domain, user types, core features, data models, and technical requirements
type: project
---

# Nền Tảng Tử Vi — FastAPI Backend

## Domain Overview
Vietnamese astrology (Tử Vi) platform with 3 user tiers:
- **Người_Dùng_Phổ_Thông** — casual users wanting simple visual insights
- **Người_Nghiên_Cứu** — enthusiast researchers needing precise calculation tools
- **Chuyên_Gia** — professional astrologers needing CRM + client management

## Core Domain Concepts
- **Lá_Số** — astrology chart: 108 stars (Sao) placed across 12 houses (Cung) based on birth data
- **Động_Cơ_Tử_Vi** — core calculation engine: solar→lunar calendar conversion + star placement
- **Ma_Trận_Lá_Số** — JSON structure containing star positions across 12 houses (stored as JSONB)
- **Lưu_Sao** — time-dependent moving stars (Lưu Thái Tuế, Lưu Thiên Mã, Lưu Lộc Tồn)
- **Cung_Mệnh** — primary house representing core destiny
- **Âm_Lịch / Dương_Lịch** — lunar (Vietnamese traditional) / Gregorian calendar systems

## FastAPI Backend Features to Implement

### Auth (Req 1)
- SSO via Google + Facebook OAuth2 redirect flow
- Email/password registration with validation
- Record `last_login` timestamp on successful login
- Never expose security details in error messages

### Birth Data & Calendar (Req 2, 3)
- Required fields: name, gender, dob_solar, birth_hour (HH:MM 24h)
- Date range: 1900-01-01 to today
- Default birth_hour = 12:00 if missing (notify user)
- Solar→Lunar conversion using Vietnamese lunar algorithm
- Must be reversible (round-trip property) for all dates 1900–2100
- Handle timezone offset based on birth location
- Boundary detection using astronomical new moon calculation

### Chart Calculation (Req 4, 5)
- Calculate all 108 stars across 12 houses from lunar date + birth_hour + gender
- Deterministic: same input → identical Ma_Trận_Lá_Số always
- Validate every house has ≥1 star after placement
- Store Ma_Trận_Lá_Số as JSONB with user_id reference
- Retrieve from DB without recalculation; return most recent chart by default

### AI Interpretation (Req 7)
- Send Ma_Trận_Lá_Số to external AI service as structured JSON (house number + star names)
- Validate response: non-empty, in Vietnamese
- Must generate at least one interpretation for Cung_Mệnh
- Cache AI responses; serve cache if AI service unavailable (graceful degradation)

### Researcher Tools (Req 8–11)
- Configurable star placement rules; save named configs with configuration_id linked to chart
- Chart comparison: side-by-side or merged view, compatibility scoring
- Annotations: save with user_id + chart_id + house/star reference + modified_at timestamp
- Advanced search: filter by star name, house position, date range with AND logic

### Professional CRM (Req 12–15)
- Client profiles linked to expert_id; multiple charts per client
- Bulk operations: tag, export
- Tag system: custom #labels, OR filter logic, cascade delete tags (preserve client)
- File attachments: audio (MP3/WAV/M4A ≤50MB), PDF (≤10MB), linked to client_id + appointment_id
- PDF report export with expert branding (logo, watermark); download link valid 24h

### Notifications & Scheduling (Req 16, 18)
- Daily Lưu_Sao recalculation for all active users
- Push/email notifications based on user preference channel
- Appointment system: pending → confirmed status flow; generate meeting_link; remind 15min before

### Security (Req 23)
- Passwords: bcrypt cost factor ≥12
- Transport: HTTPS/TLS 1.3+
- Data deletion: complete within 30 days of user request
- Authorization: verify ownership or explicit permission on every data access
- Encrypt sensitive fields at rest: dob_solar, birth_hour with AES-256

### Performance (Req 24)
- Rate limit: 100 req/min per user_id; return HTTP 429 + Retry-After header on exceed
- Chart calculation: ≤2s p95
- DB queries must use indexed fields: user_id, expert_id, log_date

## Key Data Fields
| Entity | Notable Fields |
|---|---|
| Users | user_id, last_login, streak_count |
| Charts (Lá_Số) | user_id, name, gender, dob_solar, birth_hour, chart_matrix (JSONB), configuration_id |
| Clients | client_id, expert_id, tags, last_consultation |
| Appointments | appointment_id, client_id, expert_id, status, payment_status, meeting_link |
| Annotations | user_id, chart_id, house/star ref, content, modified_at |
| JournalLogs | user_id, log_date, content, luu_sao_positions |
| Attachments | client_id, appointment_id, file_type, file_size, upload_date |

**Why:** This is the authoritative requirements doc for the project. All backend API design, DB schema, and business logic should trace back to these 25 requirements.

**How to apply:** Reference when designing FastAPI routes, Pydantic models, DB migrations, or evaluating whether a feature is in-scope.

