import asyncio
import base64
import hashlib
import hmac
import importlib
import json

from fastapi.testclient import TestClient

import docusign_client
import server
from test_quotes import FakeDB, admin_client, db, quote_payload  # noqa: F401 - shared fixtures

contracts = importlib.import_module("contracts")


def _mark_quote_sent(quote_id: str, db_):
    doc = next(d for d in db_.quotes.docs if d["_id"] == quote_id)
    doc["status"] = "SENT"
    return doc


def test_preview_contract_pdf_before_any_send(admin_client, db, monkeypatch):
    captured = {}

    def fake_build(quote, customer, contract_number, **kwargs):
        captured["contract_number"] = contract_number
        return b"%PDF-1.4 fake"

    monkeypatch.setattr(contracts, "build_contract_pdf", fake_build)

    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    response = admin_client.get(f"/api/admin/contracts/{quote['id']}/pdf")
    assert response.status_code == 200
    assert captured["contract_number"] == "CT-DRAFT"


def test_send_contract_generates_envelope_and_transitions_status(admin_client, db, monkeypatch):
    monkeypatch.setattr(contracts, "build_contract_pdf", lambda *a, **k: b"%PDF-1.4 fake")

    captured = {}

    def fake_create_envelope(**kwargs):
        captured.update(kwargs)
        return "envelope-123"

    monkeypatch.setattr(docusign_client, "create_envelope", fake_create_envelope)

    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    _mark_quote_sent(quote["id"], db)

    response = admin_client.post(f"/api/admin/contracts/{quote['id']}/send")
    assert response.status_code == 200
    body = response.json()
    assert body["contract_status"] == "GENERATED"
    assert body["contract_number"].startswith("CT-")
    assert body["docusign_envelope_id"] == "envelope-123"
    assert captured["client_user_id"] == quote["id"]


def test_send_contract_requires_quote_to_be_sent_first(admin_client, db, monkeypatch):
    monkeypatch.setattr(docusign_client, "create_envelope", lambda **k: "envelope-x")
    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    # Quote is still DRAFT - never sent to the client.
    response = admin_client.post(f"/api/admin/contracts/{quote['id']}/send")
    assert response.status_code == 409


def test_send_contract_rejects_double_send(admin_client, db, monkeypatch):
    monkeypatch.setattr(contracts, "build_contract_pdf", lambda *a, **k: b"%PDF-1.4 fake")
    monkeypatch.setattr(docusign_client, "create_envelope", lambda **k: "envelope-x")

    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    _mark_quote_sent(quote["id"], db)
    admin_client.post(f"/api/admin/contracts/{quote['id']}/send")

    response = admin_client.post(f"/api/admin/contracts/{quote['id']}/send")
    assert response.status_code == 409


def test_pay_deposit_requires_signed_contract_even_if_status_allows_it(admin_client, db):
    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    doc = _mark_quote_sent(quote["id"], db)
    assert doc["contract_status"] == "NOT_GENERATED"

    client = TestClient(server.app)
    response = client.post(f"/api/quotes/public/{doc['public_token']}/pay-deposit")
    assert response.status_code == 409
    assert "contract" in response.json()["detail"].lower()


def test_signing_url_requires_generated_contract(admin_client, db):
    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    doc = _mark_quote_sent(quote["id"], db)

    client = TestClient(server.app)
    response = client.post(f"/api/contracts/public/{doc['public_token']}/signing-url")
    assert response.status_code == 409


def test_signing_url_returns_fresh_url_every_call(admin_client, db, monkeypatch):
    monkeypatch.setattr(contracts, "build_contract_pdf", lambda *a, **k: b"%PDF-1.4 fake")
    monkeypatch.setattr(docusign_client, "create_envelope", lambda **k: "envelope-x")

    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    doc = _mark_quote_sent(quote["id"], db)
    admin_client.post(f"/api/admin/contracts/{quote['id']}/send")

    calls = []

    def fake_view(**kwargs):
        calls.append(kwargs)
        return f"https://demo.docusign.net/signing/{len(calls)}"

    monkeypatch.setattr(docusign_client, "get_recipient_view_url", fake_view)

    client = TestClient(server.app)
    first = client.post(f"/api/contracts/public/{doc['public_token']}/signing-url")
    second = client.post(f"/api/contracts/public/{doc['public_token']}/signing-url")
    assert first.status_code == second.status_code == 200
    assert first.json()["url"] != second.json()["url"]
    assert len(calls) == 2
    assert calls[0]["client_user_id"] == quote["id"]


def test_handle_contract_signed_is_idempotent(db):
    doc = {
        "_id": "quote-1", "docusign_envelope_id": "envelope-1", "contract_status": "GENERATED",
        "contract_signed_at": None, "updated_at": None,
    }
    db.quotes.docs.append(doc)

    asyncio.run(contracts.handle_contract_signed("quote-1"))
    first_signed_at = doc["contract_signed_at"]
    assert doc["contract_status"] == "SIGNED"
    assert first_signed_at is not None

    asyncio.run(contracts.handle_contract_signed("quote-1"))
    assert doc["contract_status"] == "SIGNED"


def test_verify_webhook_signature_accepts_valid_and_rejects_invalid(monkeypatch):
    monkeypatch.setattr(docusign_client, "DOCUSIGN_HMAC_KEY", "test-hmac-secret")
    body = b'{"event":"envelope-completed"}'
    valid_sig = base64.b64encode(
        hmac.new(b"test-hmac-secret", body, hashlib.sha256).digest()
    ).decode("ascii")

    assert docusign_client.verify_webhook_signature(body, valid_sig) is True
    assert docusign_client.verify_webhook_signature(body, "not-a-real-signature") is False
    assert docusign_client.verify_webhook_signature(body, "") is False


def test_docusign_webhook_marks_quote_signed(admin_client, db, monkeypatch):
    monkeypatch.setattr(docusign_client, "DOCUSIGN_HMAC_KEY", "test-hmac-secret")

    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    doc = _mark_quote_sent(quote["id"], db)
    doc["docusign_envelope_id"] = "envelope-abc"
    doc["contract_status"] = "GENERATED"

    body = json.dumps({"event": "envelope-completed", "data": {"envelopeId": "envelope-abc"}}).encode()
    signature = base64.b64encode(
        hmac.new(b"test-hmac-secret", body, hashlib.sha256).digest()
    ).decode("ascii")

    client = TestClient(server.app)
    response = client.post(
        "/api/webhooks/docusign", content=body, headers={"x-docusign-signature-1": signature}
    )
    assert response.status_code == 200
    assert doc["contract_status"] == "SIGNED"


def test_docusign_webhook_rejects_bad_signature(admin_client, db, monkeypatch):
    monkeypatch.setattr(docusign_client, "DOCUSIGN_HMAC_KEY", "test-hmac-secret")
    body = json.dumps({"event": "envelope-completed", "data": {"envelopeId": "envelope-abc"}}).encode()

    client = TestClient(server.app)
    response = client.post(
        "/api/webhooks/docusign", content=body, headers={"x-docusign-signature-1": "wrong"}
    )
    assert response.status_code == 400


def test_docusign_webhook_returns_503_when_not_configured(admin_client, db, monkeypatch):
    monkeypatch.setattr(docusign_client, "DOCUSIGN_HMAC_KEY", "")
    client = TestClient(server.app)
    response = client.post("/api/webhooks/docusign", content=b"{}")
    assert response.status_code == 503
