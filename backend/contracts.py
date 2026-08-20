"""Contract generation and DocuSign e-signature flow for a quote, gating the 50% deposit
payment (see pay_deposit in quotes.py).

Imports shared infrastructure (db, admin auth, FRONTEND_URL, contract config) from server.py -
same `import server` (not `from server import db`) convention as quotes.py, for the same
reason: tests monkeypatch attributes on the `server` module, which a `from server import db`
here would silently ignore. See quotes.py's module docstring for the full rationale.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from pymongo import ReturnDocument
from starlette.concurrency import run_in_threadpool

import docusign_client
from pdf_contract import build_contract_pdf
from quotes import _serialize_quote

import server


async def _get_quote_or_404(quote_id: str) -> dict:
    quote = await server.db.quotes.find_one({"_id": quote_id})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


async def _get_quote_by_token_or_404(token: str) -> dict:
    quote = await server.db.quotes.find_one({"public_token": token})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


async def _get_customer_or_404(customer_id: str) -> dict:
    customer = await server.db.customers.find_one({"_id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


async def _generate_contract_number() -> str:
    year = datetime.now(timezone.utc).year
    result = await server.db.counters.find_one_and_update(
        {"_id": f"contract-{year}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return f"CT-{year}-{result['seq']:04d}"


def _build_contract_pdf_for_quote(quote: dict, customer: dict, contract_number: str) -> bytes:
    return build_contract_pdf(
        quote, customer, contract_number,
        provider_nif=server.CONTRACT_PROVIDER_NIF,
        liability_text=server.CONTRACT_LIABILITY_TEXT,
        jurisdiction_city=server.CONTRACT_JURISDICTION_CITY,
    )


def _signer_name(customer: dict) -> str:
    return customer.get("contact_person") or customer.get("company_name") or customer["email"]


async def handle_contract_signed(quote_id: str) -> None:
    """Called from the DocuSign webhook (server.py) once an envelope is completed.
    Idempotent: re-applying the same $set for a resent Connect event is a no-op in effect."""
    now = datetime.now(timezone.utc)
    await server.db.quotes.update_one(
        {"_id": quote_id},
        {"$set": {"contract_status": "SIGNED", "contract_signed_at": now, "updated_at": now}},
    )
    server.logger.info(f"Quote {quote_id} contract signed")


# ---------- Admin router ----------
admin_contracts_router = APIRouter(prefix="/admin/contracts", tags=["contracts"])


@admin_contracts_router.get("/{quote_id}/pdf")
async def preview_contract_pdf(quote_id: str, current: str = Depends(server.get_current_admin)):
    """Preview only - no DocuSign envelope, no DB write. Available as soon as a quote has a
    customer, so the admin can sanity-check the contract text before sending it for signature."""
    quote = await _get_quote_or_404(quote_id)
    customer = await _get_customer_or_404(quote["customer_id"])
    contract_number = quote.get("contract_number") or "CT-DRAFT"
    pdf_bytes = await run_in_threadpool(_build_contract_pdf_for_quote, quote, customer, contract_number)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={contract_number}.pdf"},
    )


@admin_contracts_router.post("/{quote_id}/send")
async def send_contract(quote_id: str, current: str = Depends(server.get_current_admin)):
    quote = await _get_quote_or_404(quote_id)
    if quote["status"] not in ("SENT", "VIEWED"):
        raise HTTPException(
            status_code=409, detail="The quote must be sent to the client before generating its contract"
        )
    if quote.get("contract_status", "NOT_GENERATED") != "NOT_GENERATED":
        raise HTTPException(status_code=409, detail="A contract has already been generated for this quote")

    customer = await _get_customer_or_404(quote["customer_id"])
    now = datetime.now(timezone.utc)
    contract_number = await _generate_contract_number()
    pdf_bytes = await run_in_threadpool(_build_contract_pdf_for_quote, quote, customer, contract_number)

    webhook_url = f"{server.BACKEND_PUBLIC_URL}/api/webhooks/docusign" if server.BACKEND_PUBLIC_URL else None
    envelope_id = await run_in_threadpool(
        docusign_client.create_envelope,
        pdf_bytes=pdf_bytes,
        contract_number=contract_number,
        signer_email=customer["email"],
        signer_name=_signer_name(customer),
        client_user_id=quote_id,
        webhook_url=webhook_url,
    )

    await server.db.quotes.update_one(
        {"_id": quote_id},
        {"$set": {
            "contract_number": contract_number,
            "docusign_envelope_id": envelope_id,
            "contract_status": "GENERATED",
            "contract_generated_at": now,
            "updated_at": now,
        }},
    )
    server.logger.info(f"Contract {contract_number} generated for quote {quote['quote_number']}")
    updated = await server.db.quotes.find_one({"_id": quote_id})
    return _serialize_quote(updated)


# ---------- Public router (token-based, no admin auth - reuses the quote's own public_token) ----------
public_contracts_router = APIRouter(prefix="/contracts/public", tags=["contracts-public"])


@public_contracts_router.get("/{token}")
async def get_public_contract(token: str):
    quote = await _get_quote_by_token_or_404(token)
    contract_status = quote.get("contract_status", "NOT_GENERATED")
    return {
        "contract_status": contract_status,
        "contract_number": quote.get("contract_number"),
        "can_sign": contract_status == "GENERATED",
    }


@public_contracts_router.post("/{token}/signing-url")
async def get_contract_signing_url(token: str):
    quote = await _get_quote_by_token_or_404(token)
    if quote.get("contract_status", "NOT_GENERATED") != "GENERATED":
        raise HTTPException(status_code=409, detail="No contract is pending signature for this quote")
    customer = await _get_customer_or_404(quote["customer_id"])

    # DocuSign appends its own `?event=...` query param to this URL on the way back - never
    # pre-append one ourselves. This is a fresh, single-use (300s) URL on every call.
    url = await run_in_threadpool(
        docusign_client.get_recipient_view_url,
        envelope_id=quote["docusign_envelope_id"],
        signer_email=customer["email"],
        signer_name=_signer_name(customer),
        client_user_id=quote["_id"],
        return_url=f"{server.FRONTEND_URL}/quote/{token}",
    )
    return {"url": url}
