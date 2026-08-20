"""Quote creation, customer-facing quote page, PDF, and deposit/final payment flow.

Imports shared infrastructure (db, admin auth, Stripe helpers, email) from server.py. This
module is imported by server.py *after* those globals are defined - see the import site
there. That is a load-order requirement, not a circular import: by the time this module is
imported, server.py's module namespace already has everything referenced below.
"""
import uuid
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, EmailStr, Field, model_validator
from pymongo import ReturnDocument
from starlette.concurrency import run_in_threadpool

from pdf_quote import build_quote_pdf
from pricing import (
    ENGINEERING_HOURS_RATE,
    PACKAGES,
    PricingError,
    compute_quote_totals,
    price_engineering_hours_item,
    price_package_item,
)

# `import server` (not `from server import db, ...`) so every reference below reads
# server.db / server.FRONTEND_URL / etc. dynamically. Tests monkeypatch attributes on the
# `server` module (e.g. server.db = FakeDB()); a `from server import db` here would freeze a
# stale reference at import time and silently ignore that monkeypatch.
import server

QuoteStatus = Literal[
    "DRAFT", "SENT", "VIEWED", "ACCEPTED", "IN_PROGRESS",
    "FINAL_PAYMENT_REQUESTED", "COMPLETED", "EXPIRED", "VOID",
]
PaymentStatus = Literal["UNPAID", "DEPOSIT_PAID", "PAID"]

EDITABLE_STATUSES = {"DRAFT", "SENT", "VIEWED"}


# ---------- Models ----------
class CustomerIn(BaseModel):
    company_name: str = Field(min_length=1, max_length=200)
    contact_person: Optional[str] = Field(default=None, max_length=200)
    email: EmailStr
    billing_address: Optional[str] = Field(default=None, max_length=500)
    vat_id: Optional[str] = Field(default=None, max_length=50)


class QuoteItemInput(BaseModel):
    type: Literal["package", "engineering_hours"]
    product_key: Optional[Literal["rapid_design", "validated_design", "performance_design"]] = None
    description: Optional[str] = Field(default=None, max_length=500)
    quantity: float = Field(default=1, ge=0)
    extra_hours: float = Field(default=0, ge=0)
    override_confirmed: bool = False

    @model_validator(mode="after")
    def check_type_requirements(self):
        if self.type == "package" and not self.product_key:
            raise ValueError("product_key is required for package items")
        if self.type == "engineering_hours" and self.quantity <= 0:
            raise ValueError("Engineering Hours quantity must be greater than 0")
        return self


class QuoteCreate(BaseModel):
    customer: CustomerIn
    project_name: str = Field(min_length=1, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=2000)
    valid_days: int = Field(default=30, ge=1, le=365)
    # 21% is Arroyo Systems' real default (catalog prices are quoted excl. VAT); still
    # per-quote configurable since VAT treatment can differ by client/operation.
    vat_rate: float = Field(default=0.21, ge=0, le=1)
    currency: str = Field(default="eur", min_length=3, max_length=3)
    items: list[QuoteItemInput] = Field(min_length=1)


# ---------- Helpers ----------
def _process_items(items: list[QuoteItemInput]) -> list[dict]:
    """Prices every item via pricing.py - the only place quote amounts are computed, so the
    same numbers end up in the DB, the PDF and the Stripe checkout session."""
    processed = []
    for item in items:
        if item.type == "package":
            spec = PACKAGES[item.product_key]
            try:
                total = price_package_item(item.product_key, item.extra_hours, item.override_confirmed)
            except PricingError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
            processed.append({
                "id": str(uuid.uuid4()),
                "type": "package",
                "product_key": item.product_key,
                "description": server.sanitize_text(item.description) if item.description else spec["name"],
                "quantity": 1,
                "unit_price": total,
                "extra_hours": item.extra_hours,
                "total": total,
            })
        else:
            try:
                total = price_engineering_hours_item(item.quantity)
            except PricingError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
            processed.append({
                "id": str(uuid.uuid4()),
                "type": "engineering_hours",
                "product_key": None,
                "description": server.sanitize_text(item.description) if item.description else "Engineering Hours",
                "quantity": item.quantity,
                "unit_price": ENGINEERING_HOURS_RATE,
                "extra_hours": 0,
                "total": total,
            })
    return processed


async def _generate_quote_number() -> str:
    year = datetime.now(timezone.utc).year
    result = await server.db.counters.find_one_and_update(
        {"_id": f"quote-{year}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return f"AS-{year}-{result['seq']:04d}"


async def _upsert_customer(customer: CustomerIn) -> dict:
    email = str(customer.email).lower().strip()
    now = datetime.now(timezone.utc)
    doc = {
        "company_name": server.sanitize_text(customer.company_name),
        "contact_person": server.sanitize_text(customer.contact_person) if customer.contact_person else None,
        "email": email,
        "billing_address": server.sanitize_text(customer.billing_address) if customer.billing_address else None,
        "vat_id": server.sanitize_text(customer.vat_id) if customer.vat_id else None,
        "updated_at": now,
    }
    existing = await server.db.customers.find_one({"email": email})
    if existing:
        await server.db.customers.update_one({"_id": existing["_id"]}, {"$set": doc})
        doc["_id"] = existing["_id"]
    else:
        doc["_id"] = str(uuid.uuid4())
        doc["created_at"] = now
        await server.db.customers.insert_one(doc)
    return doc


async def _get_quote_or_404(quote_id: str) -> dict:
    quote = await server.db.quotes.find_one({"_id": quote_id})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


async def _get_customer_or_404(customer_id: str) -> dict:
    customer = await server.db.customers.find_one({"_id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def _serialize_quote(doc: dict) -> dict:
    out = dict(doc)
    if "_id" in out:
        out["id"] = out.pop("_id")
    for key in (
        "issue_date", "valid_until", "created_at", "updated_at", "sent_at", "viewed_at",
        "accepted_at", "deposit_paid_at", "final_requested_at", "paid_at", "completed_at",
    ):
        if isinstance(out.get(key), datetime):
            out[key] = out[key].isoformat()
    return out


def _serialize_quote_public(doc: dict, customer: dict) -> dict:
    out = _serialize_quote(doc)
    out.pop("notes", None)
    out.pop("created_by", None)
    out.pop("public_token", None)
    out["customer"] = {
        "company_name": customer.get("company_name"),
        "contact_person": customer.get("contact_person"),
        "email": customer.get("email"),
    }
    return out


def _quote_public_url(token: str) -> str:
    return f"{server.FRONTEND_URL}/quote/{token}"


async def handle_quote_payment_confirmed(quote_id: str, payment_type: Optional[str]) -> None:
    """Called from the Stripe webhook (server.py) once an order tied to a quote is paid.
    Idempotent: re-applying the same $set for a resent webhook event is a no-op in effect."""
    now = datetime.now(timezone.utc)
    if payment_type == "deposit":
        await server.db.quotes.update_one(
            {"_id": quote_id},
            {"$set": {
                "payment_status": "DEPOSIT_PAID",
                "status": "IN_PROGRESS",
                "deposit_paid_at": now,
                "updated_at": now,
            }},
        )
        server.logger.info(f"Quote {quote_id} deposit paid - now IN_PROGRESS")
    elif payment_type == "final":
        await server.db.quotes.update_one(
            {"_id": quote_id},
            {"$set": {
                "payment_status": "PAID",
                "status": "COMPLETED",
                "paid_at": now,
                "completed_at": now,
                "updated_at": now,
            }},
        )
        server.logger.info(f"Quote {quote_id} final payment received - now COMPLETED")


def _build_quote_email(quote: dict, customer: dict, subject: str, intro_lines: list[str]) -> EmailMessage:
    email = EmailMessage()
    email["Subject"] = subject
    email["To"] = customer["email"]
    url = _quote_public_url(quote["public_token"])
    lines = [
        *intro_lines,
        "",
        f"Quote number: {quote['quote_number']}",
        f"Total: {quote['total']:.2f} {quote['currency'].upper()}",
        "",
        f"View and pay online: {url}",
        f"Download PDF: {url}/pdf",
        "",
        "Questions about this quote? Reply to this email or write to contact@arroyo-systems.com.",
    ]
    email.set_content("\n".join(lines))
    return email


async def _send_quote_email(quote: dict, customer: dict, subject: str, intro_lines: list[str]) -> None:
    if not server.is_email_notifications_enabled():
        server.logger.info(f"Quote email skipped for {quote['quote_number']} - email notifications not configured")
        return
    try:
        await run_in_threadpool(server.send_email_message, _build_quote_email(quote, customer, subject, intro_lines))
    except Exception:
        server.logger.exception(f"Could not send quote email for {quote['quote_number']}")


# ---------- Admin router ----------
admin_quotes_router = APIRouter(prefix="/admin/quotes", tags=["quotes"])


@admin_quotes_router.post("", status_code=201)
async def create_quote(payload: QuoteCreate, current: str = Depends(server.get_current_admin)):
    customer = await _upsert_customer(payload.customer)
    items = _process_items(payload.items)
    totals = compute_quote_totals(items, payload.vat_rate)

    now = datetime.now(timezone.utc)
    quote = {
        "_id": str(uuid.uuid4()),
        "quote_number": await _generate_quote_number(),
        "version": 1,
        "supersedes_id": None,
        "customer_id": customer["_id"],
        "project_name": server.sanitize_text(payload.project_name),
        "notes": server.sanitize_text(payload.notes) if payload.notes else None,
        "issue_date": now,
        "valid_until": now + timedelta(days=payload.valid_days),
        "currency": payload.currency.lower(),
        "items": items,
        **totals,
        "status": "DRAFT",
        "payment_status": "UNPAID",
        "public_token": uuid.uuid4().hex + uuid.uuid4().hex,
        "created_at": now,
        "updated_at": now,
        "sent_at": None,
        "viewed_at": None,
        "accepted_at": None,
        "deposit_paid_at": None,
        "final_requested_at": None,
        "paid_at": None,
        "completed_at": None,
        "created_by": current,
    }
    await server.db.quotes.insert_one(quote)
    server.logger.info(f"Created quote {quote['quote_number']} for {customer['email']}")
    return _serialize_quote(quote)


@admin_quotes_router.get("")
async def list_quotes(current: str = Depends(server.get_current_admin)):
    cursor = server.db.quotes.find({"status": {"$ne": "VOID"}}).sort("created_at", -1).limit(1000)
    customers = {c["_id"]: c async for c in server.db.customers.find({})}
    items = []
    async for d in cursor:
        row = _serialize_quote(d)
        customer = customers.get(d["customer_id"], {})
        row["customer_name"] = customer.get("company_name")
        items.append(row)
    return {"items": items, "total": len(items)}


@admin_quotes_router.get("/{quote_id}")
async def get_quote(quote_id: str, current: str = Depends(server.get_current_admin)):
    quote = await _get_quote_or_404(quote_id)
    customer = await _get_customer_or_404(quote["customer_id"])
    out = _serialize_quote(quote)
    out["customer"] = {k: v for k, v in customer.items() if k not in ("_id", "created_at", "updated_at")}
    return out


@admin_quotes_router.patch("/{quote_id}")
async def update_quote(quote_id: str, payload: QuoteCreate, current: str = Depends(server.get_current_admin)):
    quote = await _get_quote_or_404(quote_id)
    if quote["payment_status"] != "UNPAID" or quote["status"] not in EDITABLE_STATUSES:
        raise HTTPException(
            status_code=409,
            detail="This quote already has payments or has been accepted - create a new version instead of editing it.",
        )

    customer = await _upsert_customer(payload.customer)
    items = _process_items(payload.items)
    totals = compute_quote_totals(items, payload.vat_rate)
    now = datetime.now(timezone.utc)

    update = {
        "customer_id": customer["_id"],
        "project_name": server.sanitize_text(payload.project_name),
        "notes": server.sanitize_text(payload.notes) if payload.notes else None,
        "valid_until": quote["issue_date"] + timedelta(days=payload.valid_days),
        "currency": payload.currency.lower(),
        "items": items,
        **totals,
        "updated_at": now,
    }
    await server.db.quotes.update_one({"_id": quote_id}, {"$set": update})
    updated = await server.db.quotes.find_one({"_id": quote_id})
    return _serialize_quote(updated)


@admin_quotes_router.post("/{quote_id}/versions", status_code=201)
async def create_quote_version(quote_id: str, current: str = Depends(server.get_current_admin)):
    quote = await _get_quote_or_404(quote_id)
    if quote["payment_status"] != "UNPAID":
        raise HTTPException(status_code=409, detail="Cannot version a quote that already has payments")

    now = datetime.now(timezone.utc)
    new_quote = dict(quote)
    new_quote["_id"] = str(uuid.uuid4())
    new_quote["version"] = quote.get("version", 1) + 1
    new_quote["supersedes_id"] = quote_id
    new_quote["quote_number"] = quote["quote_number"]
    new_quote["status"] = "DRAFT"
    new_quote["payment_status"] = "UNPAID"
    new_quote["public_token"] = uuid.uuid4().hex + uuid.uuid4().hex
    new_quote["created_at"] = now
    new_quote["updated_at"] = now
    for key in ("sent_at", "viewed_at", "accepted_at", "deposit_paid_at", "final_requested_at", "paid_at", "completed_at"):
        new_quote[key] = None

    await server.db.quotes.insert_one(new_quote)
    await server.db.quotes.update_one({"_id": quote_id}, {"$set": {"status": "VOID", "updated_at": now}})
    server.logger.info(f"Created version {new_quote['version']} of quote {quote['quote_number']}")
    return _serialize_quote(new_quote)


@admin_quotes_router.get("/{quote_id}/pdf")
async def get_quote_pdf_admin(quote_id: str, current: str = Depends(server.get_current_admin)):
    quote = await _get_quote_or_404(quote_id)
    customer = await _get_customer_or_404(quote["customer_id"])
    pdf_bytes = await run_in_threadpool(build_quote_pdf, quote, customer)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={quote['quote_number']}.pdf"},
    )


@admin_quotes_router.post("/{quote_id}/send")
async def send_quote(quote_id: str, current: str = Depends(server.get_current_admin)):
    quote = await _get_quote_or_404(quote_id)
    customer = await _get_customer_or_404(quote["customer_id"])
    now = datetime.now(timezone.utc)
    await server.db.quotes.update_one(
        {"_id": quote_id},
        {"$set": {"status": "SENT", "sent_at": now, "updated_at": now}},
    )
    await _send_quote_email(
        quote, customer,
        subject=f"Arroyo Systems - Quote {quote['quote_number']}",
        intro_lines=[
            f"Hi {customer.get('contact_person') or customer.get('company_name')},",
            "",
            f"Please find your quote for {quote['project_name']} below.",
        ],
    )
    updated = await server.db.quotes.find_one({"_id": quote_id})
    return _serialize_quote(updated)


@admin_quotes_router.post("/{quote_id}/request-final-payment")
async def request_final_payment(quote_id: str, current: str = Depends(server.get_current_admin)):
    quote = await _get_quote_or_404(quote_id)
    if quote["status"] != "IN_PROGRESS" or quote["payment_status"] != "DEPOSIT_PAID":
        raise HTTPException(status_code=409, detail="Final payment can only be requested for an in-progress quote with a paid deposit")

    customer = await _get_customer_or_404(quote["customer_id"])
    now = datetime.now(timezone.utc)
    await server.db.quotes.update_one(
        {"_id": quote_id},
        {"$set": {"status": "FINAL_PAYMENT_REQUESTED", "final_requested_at": now, "updated_at": now}},
    )
    await _send_quote_email(
        quote, customer,
        subject=f"Arroyo Systems - Final payment due for {quote['quote_number']}",
        intro_lines=[
            f"Hi {customer.get('contact_person') or customer.get('company_name')},",
            "",
            f"The work on {quote['project_name']} is complete. The remaining balance "
            f"of {quote['remaining_amount']:.2f} {quote['currency'].upper()} is now due.",
        ],
    )
    updated = await server.db.quotes.find_one({"_id": quote_id})
    return _serialize_quote(updated)


# ---------- Public router (token-based, no admin auth) ----------
public_quotes_router = APIRouter(prefix="/quotes/public", tags=["quotes-public"])


async def _get_quote_by_token_or_404(token: str) -> dict:
    quote = await server.db.quotes.find_one({"public_token": token})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


@public_quotes_router.get("/{token}")
async def get_public_quote(token: str):
    quote = await _get_quote_by_token_or_404(token)
    customer = await _get_customer_or_404(quote["customer_id"])
    if quote["status"] == "SENT":
        now = datetime.now(timezone.utc)
        await server.db.quotes.update_one({"_id": quote["_id"]}, {"$set": {"status": "VIEWED", "viewed_at": now, "updated_at": now}})
        quote["status"] = "VIEWED"
    return _serialize_quote_public(quote, customer)


@public_quotes_router.get("/{token}/pdf")
async def get_public_quote_pdf(token: str):
    quote = await _get_quote_by_token_or_404(token)
    customer = await _get_customer_or_404(quote["customer_id"])
    pdf_bytes = await run_in_threadpool(build_quote_pdf, quote, customer)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={quote['quote_number']}.pdf"},
    )


@public_quotes_router.post("/{token}/pay-deposit")
async def pay_deposit(token: str):
    quote = await _get_quote_by_token_or_404(token)
    if quote["status"] not in ("SENT", "VIEWED"):
        raise HTTPException(status_code=409, detail="This quote cannot be accepted in its current state")
    customer = await _get_customer_or_404(quote["customer_id"])

    now = datetime.now(timezone.utc)
    await server.db.quotes.update_one(
        {"_id": quote["_id"]},
        {"$set": {"status": "ACCEPTED", "accepted_at": now, "updated_at": now}},
    )

    session, _order = await server.create_stripe_payment_session(
        description=f"Deposit (50%) - Quote {quote['quote_number']} - {quote['project_name']}",
        amount=quote["deposit_amount"],
        currency=quote["currency"],
        customer_email=customer["email"],
        reference=quote["quote_number"],
        quote_id=quote["_id"],
        payment_type="deposit",
        success_url=f"{_quote_public_url(token)}?payment=success",
        cancel_url=f"{_quote_public_url(token)}?payment=cancelled",
    )
    return {"url": session["url"]}


@public_quotes_router.post("/{token}/pay-final")
async def pay_final(token: str):
    quote = await _get_quote_by_token_or_404(token)
    if quote["status"] != "FINAL_PAYMENT_REQUESTED":
        raise HTTPException(status_code=409, detail="No final payment is due for this quote right now")
    customer = await _get_customer_or_404(quote["customer_id"])

    session, _order = await server.create_stripe_payment_session(
        description=f"Final balance (50%) - Quote {quote['quote_number']} - {quote['project_name']}",
        amount=quote["remaining_amount"],
        currency=quote["currency"],
        customer_email=customer["email"],
        reference=quote["quote_number"],
        quote_id=quote["_id"],
        payment_type="final",
        success_url=f"{_quote_public_url(token)}?payment=success",
        cancel_url=f"{_quote_public_url(token)}?payment=cancelled",
    )
    return {"url": session["url"]}
