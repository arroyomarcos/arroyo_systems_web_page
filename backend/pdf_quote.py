"""Generates the quote PDF directly from quote data (never from a template file the client
could edit). Admin and client downloads call the same function, so the document is always
byte-for-byte consistent with what's stored in the database."""
from datetime import datetime
from io import BytesIO
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ASSETS_DIR = Path(__file__).parent / "assets"
LOGO_PATH = ASSETS_DIR / "logo-arroyo-systems.png"
LOGO_ASPECT_RATIO = 1668 / 434  # width / height of the source PNG

COMPANY_NAME = "Arroyo Systems"
COMPANY_ADDRESS = "Avenida del Planetario, 6, 28045 Madrid, Spain"
COMPANY_EMAIL = "contact@arroyo-systems.com"
COMPANY_PHONE = "+34 691 018 974"
COMPANY_WEB = "arroyo-systems.com"

NAVY = colors.HexColor("#0a1a3a")
MUTED = colors.HexColor("#555555")
BORDER = colors.HexColor("#dddddd")

TERMS = [
    "This quote includes only the deliverables specified in the services table.",
    "Changes to the scope beyond what was agreed may involve additional costs.",
    "Timelines are estimates and depend on project complexity and information provided by the client.",
    "This quote is valid until the date shown above.",
    "Starting the work requires written acceptance (online or by email) of this quote.",
    "In case of cancellation during the project, work completed up to that point will be invoiced.",
    "Deliverables are provided in digital format (PDF, STEP, DWG, or others as agreed).",
]


def _fmt_money(amount: float, currency: str = "EUR") -> str:
    symbol = "€" if currency.upper() == "EUR" else currency.upper() + " "
    return f"{symbol}{amount:,.2f}"


def _fmt_date(value) -> str:
    if isinstance(value, datetime):
        return value.strftime("%d %b %Y")
    return str(value or "")


def build_quote_pdf(quote: dict, customer: dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4, topMargin=20 * mm, bottomMargin=18 * mm, leftMargin=20 * mm, rightMargin=20 * mm
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("QuoteTitle", parent=styles["Heading1"], fontSize=22, spaceAfter=2, textColor=NAVY)
    small = ParagraphStyle("Small", parent=styles["Normal"], fontSize=9, textColor=MUTED, leading=13)
    body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, leading=14)
    right_small = ParagraphStyle("RightSmall", parent=small, alignment=TA_RIGHT)

    currency = quote.get("currency", "EUR")
    elements = []

    if LOGO_PATH.exists():
        logo_width = 42 * mm
        elements.append(Image(str(LOGO_PATH), width=logo_width, height=logo_width / LOGO_ASPECT_RATIO))
        elements.append(Spacer(1, 4 * mm))
    elements.append(Paragraph(f"<b>{COMPANY_NAME}</b>", body))
    elements.append(Paragraph(COMPANY_ADDRESS, small))
    elements.append(Paragraph(COMPANY_EMAIL, small))
    elements.append(Spacer(1, 8 * mm))

    elements.append(Paragraph("Quote", title_style))
    elements.append(Paragraph(f"Quote number: {quote['quote_number']}", small))
    elements.append(Spacer(1, 6 * mm))

    left_lines = ["<b>Quote to</b>", customer.get("company_name") or ""]
    if customer.get("contact_person"):
        left_lines.append(customer["contact_person"])
    if customer.get("billing_address"):
        left_lines.append(customer["billing_address"])
    if customer.get("email"):
        left_lines.append(customer["email"])
    if customer.get("vat_id"):
        left_lines.append(f"VAT: {customer['vat_id']}")

    right_lines = [
        "<b>Details</b>",
        f"Quote no. {quote['quote_number']}",
        f"Date {_fmt_date(quote.get('issue_date'))}",
        f"Valid until {_fmt_date(quote.get('valid_until'))}",
    ]

    info_table = Table(
        [[Paragraph("<br/>".join(left_lines), body), Paragraph("<br/>".join(right_lines), body)]],
        colWidths=[100 * mm, 50 * mm],
    )
    info_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(info_table)
    elements.append(Spacer(1, 6 * mm))

    if quote.get("project_name"):
        elements.append(Paragraph(f"<b>Project:</b> {quote['project_name']}", body))
        elements.append(Spacer(1, 4 * mm))

    header = ["Service", "Description", "Qty / Hours", "Amount"]
    rows = [header]
    for item in quote.get("items", []):
        if item["type"] == "package":
            name = item.get("description") or item.get("product_key", "")
            desc = f"Includes {item['extra_hours']:g}h extra hours" if item.get("extra_hours") else ""
            qty = "-"
        else:
            name = "Engineering Hours"
            desc = item.get("description") or ""
            qty = f"{item['quantity']:g} h"
        rows.append([Paragraph(name, body), Paragraph(desc, small), qty, _fmt_money(item["total"], currency)])

    items_table = Table(rows, colWidths=[38 * mm, 62 * mm, 25 * mm, 35 * mm], repeatRows=1)
    items_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    elements.append(items_table)
    elements.append(Spacer(1, 6 * mm))

    totals_rows = [
        ["Subtotal", _fmt_money(quote["subtotal"], currency)],
        [f"VAT ({quote['vat_rate'] * 100:.0f}%)", _fmt_money(quote["vat_amount"], currency)],
        ["Total", _fmt_money(quote["total"], currency)],
    ]
    totals_table = Table(totals_rows, colWidths=[125 * mm, 35 * mm])
    totals_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("LINEABOVE", (0, -1), (-1, -1), 1, NAVY),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    elements.append(totals_table)
    elements.append(Spacer(1, 8 * mm))

    elements.append(Paragraph("<b>Payment terms</b>", body))
    payment_rows = [
        ["50% upfront - upon accepting the quote", _fmt_money(quote["deposit_amount"], currency)],
        ["50% balance - upon delivery of the deliverables", _fmt_money(quote["remaining_amount"], currency)],
    ]
    payment_table = Table(payment_rows, colWidths=[125 * mm, 35 * mm])
    payment_table.setStyle(TableStyle([("ALIGN", (1, 0), (1, -1), "RIGHT")]))
    elements.append(payment_table)
    elements.append(Spacer(1, 8 * mm))

    elements.append(Paragraph("<b>Terms and conditions</b>", body))
    for term in TERMS:
        elements.append(Paragraph(f"• {term}", small))
    elements.append(Spacer(1, 8 * mm))

    elements.append(Paragraph(f"{COMPANY_NAME} — {COMPANY_ADDRESS}", small))
    elements.append(Paragraph(f"{COMPANY_EMAIL} — {COMPANY_PHONE} — {COMPANY_WEB}", small))

    doc.build(elements)
    return buf.getvalue()
