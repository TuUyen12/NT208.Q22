"""
Notification service (Req 16).

- Lưu_Sao daily recalculation for active users
- Email dispatch via Google SMTP based on notify_channel preference
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.services.luu_sao_utils import calculate_all_tiers


class NotificationService:

    @staticmethod
    async def recalculate_luu_sao(db: AsyncSession, user_id: uuid.UUID) -> dict:
        from app.models.journal import JournalLog

        today = datetime.now(timezone.utc).date()

        result = await db.execute(
            select(JournalLog).where(
                JournalLog.user_id == user_id,
                JournalLog.log_date == today,
            )
        )
        log = result.scalar_one_or_none()

        luu_sao = calculate_all_tiers(today)

        if log:
            log.luu_sao_positions = luu_sao
        else:
            log = JournalLog(
                user_id=user_id,
                log_date=today,
                luu_sao_positions=luu_sao,
            )
            db.add(log)

        await db.commit()
        return {"log_date": today.isoformat(), "luu_sao_positions": luu_sao}

    @staticmethod
    async def daily_recalculate_all(db: AsyncSession) -> int:
        from app.models.user import User

        result = await db.execute(select(User).where(User.is_active == True))  # noqa: E712
        users = result.scalars().all()

        for user in users:
            await NotificationService.recalculate_luu_sao(db, user.user_id)

        return len(users)

    @staticmethod
    async def send_daily_horoscope_emails(db: AsyncSession) -> int:
        """
        Send daily Lưu-Sao digest email to all active users whose
        notify_channel is 'email' or 'both', and create an in-app
        notification record for ALL active users.
        Returns the number of emails sent.
        """
        from app.models.notification import Notification
        from app.models.user import User

        all_users_result = await db.execute(select(User).where(User.is_active == True))  # noqa: E712
        all_users = all_users_result.scalars().all()

        today = datetime.now(timezone.utc).date()
        luu_sao = calculate_all_tiers(today)
        date_str = today.strftime("%d/%m/%Y")

        nhat = luu_sao.get("luu_nhat", {})
        can_chi = f"{nhat.get('can', '')} {nhat.get('chi', '')}".strip()
        stars_preview = ", ".join(s["name"] for s in nhat.get("stars", [])[:3])
        notif_body = f"Ngày {can_chi} — {stars_preview}" if stars_preview else f"Sao lưu ngày {date_str}"

        sent = 0
        for user in all_users:
            # Create in-app notification for every active user
            db.add(Notification(
                user_id=user.user_id,
                title=f"Sao lưu hôm nay · {date_str}",
                body=notif_body,
                notif_type="luu_sao",
            ))

            # Send email only to users who opted in
            if user.notify_channel in ("email", "both"):
                subject = f"YinYang — Sao lưu hôm nay {date_str}"
                html = _build_email_html(user.full_name or user.email, date_str, luu_sao)
                try:
                    await _send_email(user.email, subject, html)
                    sent += 1
                except Exception:
                    pass

        await db.commit()
        return sent

    @staticmethod
    async def push_in_app(db: AsyncSession, user_id: uuid.UUID, title: str, body: str, notif_type: str = "info") -> None:
        from app.models.notification import Notification
        db.add(Notification(user_id=user_id, title=title, body=body, notif_type=notif_type))
        await db.commit()

    @staticmethod
    async def send(user, subject: str, body: str) -> None:
        channel = getattr(user, "notify_channel", "email")
        if channel in ("email", "both"):
            await _send_email(user.email, subject, body)


async def _send_email(to: str, subject: str, html_body: str) -> None:
    settings = get_settings()
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return  # not configured — skip silently

    from_addr = settings.SMTP_FROM or settings.SMTP_USER

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"YinYang Astrology <{from_addr}>"
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD.replace(" ", ""),
        start_tls=True,
    )


_STAR_META = {
    "Lộc Tồn":   {"icon": "💰", "color": "#4ade80"},
    "Kình Dương": {"icon": "⚔",  "color": "#f87171"},
    "Đà La":      {"icon": "🌑", "color": "#a78bfa"},
    "Thiên Mã":   {"icon": "🐎", "color": "#67e8f9"},
    "Thái Tuế":   {"icon": "☀",  "color": "#fbbf24"},
    "Tang Môn":   {"icon": "🪦", "color": "#94a3b8"},
    "Bạch Hổ":    {"icon": "🐯", "color": "#fb923c"},
}


def _star_style(star_name: str) -> tuple:
    for key, meta in _STAR_META.items():
        if key in star_name:
            return meta["icon"], meta["color"]
    return "✦", "#c4b5fd"


def _build_email_html(name: str, date_str: str, luu_sao: dict) -> str:
    nhat = luu_sao.get("luu_nhat", {})
    nguyet = luu_sao.get("luu_nguyet", {})
    nien = luu_sao.get("luu_nien", {})

    def star_rows(tier: dict, title: str) -> str:
        if tier.get("placeholder"):
            return ""
        can_chi = f"{tier.get('can', '')} {tier.get('chi', '')}".strip()
        stars = tier.get("stars", [])
        tu_hoa = tier.get("tu_hoa", {})

        star_items = "".join(
            (lambda icon, color:
                f'<tr>'
                f'<td style="padding:5px 8px;width:28px;font-size:16px;">{icon}</td>'
                f'<td style="padding:5px 0;font-weight:700;font-size:13px;color:{color};">{s["name"]}</td>'
                f'<td style="padding:5px 8px;font-size:12px;color:#7c6d88;text-align:right;">Cung {s["house"]}</td>'
                f'</tr>'
            )(*_star_style(s["name"]))
            for s in stars
        )
        hoa_items = "".join(
            f'<span style="display:inline-block;background:{_hoa_color(k)};color:#111;'
            f'padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;margin:3px 4px 3px 0;">'
            f'{v} {k}</span>'
            for k, v in tu_hoa.items() if v
        )
        return f"""
        <div style="margin-bottom:20px;background:rgba(255,255,255,0.03);
                    border-radius:10px;border:1px solid rgba(237,177,255,0.1);overflow:hidden;">
          <div style="padding:10px 14px;background:rgba(109,32,140,0.25);
                      font-size:12px;color:#b39ddb;font-weight:700;
                      text-transform:uppercase;letter-spacing:1px;">
            {title} &middot; {can_chi}
          </div>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="padding:4px 6px;">
            {star_items}
          </table>
          {"<div style='padding:8px 14px 12px;'>" + hoa_items + "</div>" if hoa_items else ""}
        </div>
        """

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f131c;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#1a1d2e;border-radius:16px;overflow:hidden;
                      border:1px solid rgba(237,177,255,0.15);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2d1b4e,#1a0d35);
                        padding:28px 32px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#edb1ff;
                           letter-spacing:2px;">YinYang</div>
              <div style="font-size:13px;color:#b39ddb;margin-top:4px;">
                Tử Vi Phương Đông
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 8px;">
              <div style="font-size:18px;font-weight:600;color:#f0e6ff;">
                Chào {name},
              </div>
              <div style="font-size:14px;color:#9e8daa;margin-top:6px;line-height:1.6;">
                Đây là sao lưu của bạn hôm nay, <b style="color:#edb1ff;">{date_str}</b>.
                Các vì sao đang di chuyển và ảnh hưởng đến từng cung mệnh của bạn.
              </div>
            </td>
          </tr>

          <!-- Stars -->
          <tr>
            <td style="padding:16px 32px 8px;">
              {star_rows(nhat, "Lưu Nhật")}
              {star_rows(nguyet, "Lưu Nguyệt")}
              {star_rows(nien, "Lưu Niên")}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:16px 32px 32px;text-align:center;">
              <a href="https://yinyang.io.vn/journal"
                 style="display:inline-block;padding:12px 28px;
                        background:linear-gradient(135deg,#edb1ff,#6d208c);
                        color:#111;font-weight:700;text-decoration:none;
                        border-radius:10px;font-size:14px;">
                Xem tử vi cho hôm nay trên YinYang</a>
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid rgba(255,255,255,0.06);
                        padding:20px 32px;text-align:center;">
              <div style="font-size:11px;color:#6b5f75;line-height:1.7;">
                Bạn nhận email này vì đã bật thông báo trên YinYang.<br>
                Thay đổi cài đặt tại
                <a href="https://yinyang.app/profile"
                   style="color:#9b59b6;text-decoration:none;">trang hồ sơ</a>.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _hoa_color(key: str) -> str:
    return {
        "Hóa Lộc": "#4caf50",
        "Hóa Quyền": "#ff9800",
        "Hóa Khoa": "#2196f3",
        "Hóa Kỵ": "#f44336",
    }.get(key, "#888")
