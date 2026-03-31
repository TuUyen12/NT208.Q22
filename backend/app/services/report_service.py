"""
PDF report generation for expert-branded lá số reports (Req 15).

Uses ReportLab to generate a PDF with:
  - Expert logo + watermark
  - Client info header
  - Ma_Trận_Lá_Số rendered as a 4×4 palace grid
  - AI interpretation text (if cached)

Download links are signed tokens valid for 24 h (served via /reports/download/{token}).
"""

import hashlib
import hmac
import io
import time

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.config import get_settings

settings = get_settings()

_PALACE_VI = {
    "命宫": "Mệnh", "兄弟": "Huynh Đệ", "夫妻": "Phu Thê", "子女": "Tử Nữ",
    "财帛": "Tài Bạch", "疾厄": "Tật Ách", "迁移": "Thiên Di", "仆役": "Nô Bộc",
    "官禄": "Quan Lộc", "田宅": "Điền Trạch", "福德": "Phúc Đức", "父母": "Phụ Mẫu",
}
_CHI_VI = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"]

# Grid position for each palace index (row 0-3, col 0-3) — same layout as frontend
_GRID = [
    (3, 3), (2, 3), (1, 3), (0, 3),
    (0, 2), (0, 1), (0, 0), (1, 0),
    (2, 0), (3, 0), (3, 1), (3, 2),
]


def generate_pdf(
    client_name: str,
    dob: str,
    gender: str,
    birth_hour: str,
    chart_matrix: dict,
    interpretation: dict | None = None,
    expert_name: str = "",
) -> bytes:
    """Return PDF bytes for the given chart."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm,
                            topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()

    story = []

    # --- Header ---
    title_style = ParagraphStyle("title", fontSize=18, fontName="Helvetica-Bold",
                                 textColor=colors.HexColor("#051A30"), spaceAfter=6)
    story.append(Paragraph("LÁ SỐ TỬ VI", title_style))

    sub_style = ParagraphStyle("sub", fontSize=11, textColor=colors.grey, spaceAfter=12)
    story.append(Paragraph(f"Lập bởi: {expert_name} | YIN♾️YANG", sub_style))
    story.append(Spacer(1, 0.3 * cm))

    info_style = ParagraphStyle("info", fontSize=11, spaceAfter=4)
    story.append(Paragraph(f"<b>Họ tên:</b> {client_name}", info_style))
    story.append(Paragraph(f"<b>Ngày sinh (dương lịch):</b> {dob}", info_style))
    story.append(Paragraph(f"<b>Giới tính:</b> {'Nam' if gender == 'male' else 'Nữ'}", info_style))
    story.append(Paragraph(f"<b>Giờ sinh:</b> {birth_hour}", info_style))
    story.append(Spacer(1, 0.5 * cm))

    # --- Palace grid table (4×4) ---
    story.append(Paragraph("<b>MA TRẬN LÁ SỐ</b>", ParagraphStyle("h2", fontSize=13, spaceAfter=8,
                                                                    fontName="Helvetica-Bold")))
    grid = _build_grid_table(chart_matrix)
    story.append(grid)
    story.append(Spacer(1, 0.6 * cm))

    # --- AI Interpretation ---
    if interpretation:
        story.append(Paragraph("<b>LUẬN GIẢI</b>", ParagraphStyle("h2", fontSize=13, spaceAfter=8,
                                                                    fontName="Helvetica-Bold")))
        overall = interpretation.get("overall", "")
        if overall:
            story.append(Paragraph(overall, ParagraphStyle("body", fontSize=10, leading=14, spaceAfter=6)))
        cung_menh = interpretation.get("cung_menh", "")
        if cung_menh:
            story.append(Paragraph(f"<b>Cung Mệnh:</b> {cung_menh}",
                                   ParagraphStyle("body", fontSize=10, leading=14)))

    doc.build(story, onFirstPage=_add_watermark, onLaterPages=_add_watermark)
    return buf.getvalue()


def _build_grid_table(chart_matrix: dict) -> Table:
    """Build a 4×4 ReportLab Table representing the 12 palaces."""
    cells = [[None] * 4 for _ in range(4)]

    for idx_str, stars in chart_matrix.items():
        # chart_matrix keys are "1"–"12"; iztro palace index is 0-based
        house_1idx = int(idx_str)
        palace_idx = house_1idx - 1  # convert to 0-based

        # Find the palace name by checking which palace has ★ Cung Mệnh marker
        # We reconstruct by position; stars list contains the palace's stars
        row, col = _GRID[palace_idx % 12]
        chi = _CHI_VI[palace_idx % 12]
        star_lines = "\n".join(str(s) for s in stars[:6])
        cells[row][col] = f"{chi}\n{star_lines}"

    # Center cell (2×2 merge handled via span style)
    cells[1][1] = "TRUNG TÂM"
    cells[1][2] = ""
    cells[2][1] = ""
    cells[2][2] = ""

    # Replace None with ""
    data = [[c or "" for c in row] for row in cells]

    col_width = 4.2 * cm
    row_height = 3.0 * cm

    t = Table(data, colWidths=[col_width] * 4, rowHeights=[row_height] * 4)
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#2a4a6a")),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0d2240")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        # Center 2×2 box
        ("BACKGROUND", (1, 1), (2, 2), colors.HexColor("#051A30")),
        ("SPAN", (1, 1), (2, 2)),
        ("ALIGN", (1, 1), (2, 2), "CENTER"),
        ("VALIGN", (1, 1), (2, 2), "MIDDLE"),
        ("FONTSIZE", (1, 1), (2, 2), 9),
    ]))
    return t


def _add_watermark(canvas, doc):
    """Draw a subtle watermark on each page."""
    canvas.saveState()
    canvas.setFont("Helvetica", 40)
    canvas.setFillColorRGB(0.05, 0.1, 0.18, alpha=0.07)
    canvas.rotate(45)
    canvas.drawString(6 * cm, 2 * cm, "YIN♾️YANG")
    canvas.restoreState()


# ---------------------------------------------------------------------------
# Signed download token (HMAC-SHA256, 24 h TTL)
# ---------------------------------------------------------------------------

def create_download_token(report_id: str) -> str:
    ts = int(time.time())
    msg = f"{report_id}:{ts}".encode()
    sig = hmac.new(settings.SECRET_KEY.encode(), msg, hashlib.sha256).hexdigest()
    return f"{report_id}:{ts}:{sig}"


def verify_download_token(token: str) -> str | None:
    """Returns report_id if valid and not expired, else None."""
    try:
        report_id, ts_str, sig = token.split(":", 2)
        ts = int(ts_str)
    except ValueError:
        return None

    if time.time() - ts > settings.PDF_LINK_TTL_HOURS * 3600:
        return None

    msg = f"{report_id}:{ts}".encode()
    expected = hmac.new(settings.SECRET_KEY.encode(), msg, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    return report_id
