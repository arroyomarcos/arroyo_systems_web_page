import importlib
import json
import os
import io
from pathlib import Path
from email.message import EmailMessage

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient


os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "arroyo_test")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("SKIP_DB_STARTUP", "true")

server = importlib.import_module("server")


class FakeContactMessages:
    def __init__(self):
        self.docs = []

    async def insert_one(self, doc):
        self.docs.append(doc)
        return None

    async def find_one(self, query):
        for d in self.docs:
            if all(d.get(k) == v for k, v in query.items()):
                return d
        return None

    async def delete_one(self, query):
        before = len(self.docs)
        self.docs = [d for d in self.docs if not all(d.get(k) == v for k, v in query.items())]

        class Result:
            deleted_count = before - len(self.docs)

        return Result()


class FakeOrders:
    def __init__(self):
        self.docs = []

    async def insert_one(self, doc):
        self.docs.append(doc)
        return None

    async def find_one(self, query):
        for d in self.docs:
            if all(d.get(k) == v for k, v in query.items()):
                return d
        return None

    async def update_one(self, query, update):
        for d in self.docs:
            if all(d.get(k) == v for k, v in query.items()):
                d.update(update.get("$set", {}))
                return None
        return None


class FakeDB:
    def __init__(self):
        self.contact_messages = FakeContactMessages()
        self.contact_attachments = FakeContactMessages()
        self.orders = FakeOrders()


@pytest.fixture()
def client(monkeypatch):
    server._contact_rate_limits.clear()
    monkeypatch.setattr(server, "db", FakeDB())
    monkeypatch.setattr(server, "TURNSTILE_SECRET_KEY", "")
    monkeypatch.setattr(server, "REQUIRE_PRIVACY_ACCEPTANCE", False)
    return TestClient(server.app)


@pytest.fixture()
def admin_client(client):
    server.app.dependency_overrides[server.get_current_admin] = lambda: "test-admin"
    yield client
    server.app.dependency_overrides.pop(server.get_current_admin, None)


def valid_payload(**overrides):
    payload = {
        "name": "Maria Navarro",
        "email": "maria@example.com",
        "company": "Materials Navarro",
        "project_type": "Product Design",
        "message": "I need engineering support for a machined component.",
        "privacyAccepted": True,
    }
    payload.update(overrides)
    return payload


def test_contact_requires_privacy_when_enabled(client, monkeypatch):
    monkeypatch.setattr(server, "REQUIRE_PRIVACY_ACCEPTANCE", True)
    response = client.post("/api/contact", json=valid_payload(privacyAccepted=False))
    assert response.status_code == 400


def test_contact_rejects_invalid_turnstile_token(client, monkeypatch):
    async def reject_token(token, ip):
        raise HTTPException(status_code=400, detail="Invalid anti-spam token")

    monkeypatch.setattr(server, "TURNSTILE_SECRET_KEY", "secret")
    monkeypatch.setattr(server, "verify_turnstile", reject_token)
    response = client.post("/api/contact", json=valid_payload(turnstileToken="bad-token"))
    assert response.status_code == 400


def test_contact_accepts_valid_message(client):
    response = client.post("/api/contact", json=valid_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "received"


def test_contact_triggers_email_notification(client, monkeypatch):
    calls = []

    def fake_schedule(message, attachment=None):
        calls.append(message.email)

    monkeypatch.setattr(server, "schedule_contact_notification", fake_schedule)
    response = client.post("/api/contact", json=valid_payload(email="notify@example.com"))
    assert response.status_code == 201
    assert calls == ["notify@example.com"]


def test_contact_response_survives_notification_scheduling_failure(client, monkeypatch):
    def fail_if_called_inline(message, attachment=None):
        raise AssertionError("notification should be scheduled after the message is saved")

    monkeypatch.setattr(server, "schedule_contact_notification", fail_if_called_inline)
    response = client.post("/api/contact", json=valid_payload(email="fast@example.com"))
    assert response.status_code == 201
    assert response.json()["status"] == "received"


def test_smtp_password_strips_google_display_spaces(monkeypatch):
    monkeypatch.setattr(server, "SMTP_PASSWORD", "abcd efgh ijkl mnop")
    assert server.get_smtp_password() == "abcdefghijklmnop"


def test_send_email_message_uses_stripped_smtp_password(monkeypatch):
    calls = []

    class FakeSMTP:
        def __init__(self, host, port, timeout):
            calls.append(("init", host, port, timeout))

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def starttls(self):
            calls.append(("starttls",))

        def login(self, username, password):
            calls.append(("login", username, password))

        def send_message(self, email):
            calls.append(("send", email["To"]))

    monkeypatch.setattr(server, "SMTP_HOST", "smtp.gmail.com")
    monkeypatch.setattr(server, "SMTP_PORT", 587)
    monkeypatch.setattr(server, "SMTP_USERNAME", "marcos@arroyo-systems.com")
    monkeypatch.setattr(server, "SMTP_PASSWORD", "abcd efgh ijkl mnop")
    monkeypatch.setattr(server.smtplib, "SMTP", FakeSMTP)

    email = EmailMessage()
    email["From"] = "marcos@arroyo-systems.com"
    email["To"] = "marcos@arroyo-systems.com"
    email["Subject"] = "Test"
    email.set_content("Test")

    server.send_email_message(email)

    assert ("login", "marcos@arroyo-systems.com", "abcdefghijklmnop") in calls
    assert ("send", "marcos@arroyo-systems.com") in calls


def test_send_email_message_prefers_resend_when_configured(monkeypatch):
    calls = []

    class FakeResponse:
        status = 200

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def read(self):
            return b'{"id":"email_test"}'

    def fake_urlopen(request, timeout):
        calls.append((
            request.full_url,
            timeout,
            json.loads(request.data.decode("utf-8")),
            request.headers.get("Authorization"),
            request.headers.get("User-agent"),
            request.headers.get("Accept"),
        ))
        return FakeResponse()

    monkeypatch.setattr(server, "RESEND_API_KEY", "re_test")
    monkeypatch.setattr(server, "RESEND_FROM", "Arroyo Systems <notifications@arroyo-systems.com>")
    monkeypatch.setattr(server, "CONTACT_NOTIFICATION_TO", "marcos@arroyo-systems.com")
    monkeypatch.setattr(server.urllib.request, "urlopen", fake_urlopen)

    email = EmailMessage()
    email["From"] = "Arroyo Systems <notifications@arroyo-systems.com>"
    email["To"] = "marcos@arroyo-systems.com"
    email["Subject"] = "Test"
    email.set_content("Test body")

    server.send_email_message(email)

    assert calls[0][0] == "https://api.resend.com/emails"
    assert calls[0][2]["from"] == "Arroyo Systems <notifications@arroyo-systems.com>"
    assert calls[0][2]["to"] == ["marcos@arroyo-systems.com"]
    assert calls[0][4] == "ArroyoSystemsAPI/1.0"
    assert calls[0][5] == "application/json"


def test_resend_retries_with_fallback_sender_when_domain_is_unverified(monkeypatch):
    calls = []

    class FakeResponse:
        status = 200

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def read(self):
            return b'{"id":"email_test"}'

    def fake_urlopen(request, timeout):
        payload = json.loads(request.data.decode("utf-8"))
        calls.append(payload["from"])
        if len(calls) == 1:
            raise server.urllib.error.HTTPError(
                request.full_url,
                403,
                "Forbidden",
                {},
                io.BytesIO(b'{"statusCode":403,"message":"The arroyo-systems.com domain is not verified."}'),
            )
        return FakeResponse()

    monkeypatch.setattr(server, "RESEND_API_KEY", "re_test")
    monkeypatch.setattr(server, "RESEND_FROM", "Arroyo Systems <contact@arroyo-systems.com>")
    monkeypatch.setattr(server, "RESEND_FALLBACK_FROM", "Arroyo Systems <onboarding@resend.dev>")
    monkeypatch.setattr(server.urllib.request, "urlopen", fake_urlopen)

    email = EmailMessage()
    email["From"] = "Arroyo Systems <contact@arroyo-systems.com>"
    email["To"] = "marcos@arroyo-systems.com"
    email["Subject"] = "Test"
    email.set_content("Test body")

    server.send_email_message(email)

    assert calls == [
        "Arroyo Systems <contact@arroyo-systems.com>",
        "Arroyo Systems <onboarding@resend.dev>",
    ]


def test_contact_rejects_invalid_email(client):
    response = client.post("/api/contact", json=valid_payload(email="not-an-email"))
    assert response.status_code == 422


def test_contact_rejects_too_long_message(client):
    response = client.post("/api/contact", json=valid_payload(message="x" * 4001))
    assert response.status_code == 422


def test_admin_messages_are_protected(client):
    response = client.get("/api/admin/messages")
    assert response.status_code == 401


def checkout_payload(**overrides):
    payload = {
        "description": "DFM review - bracket assembly",
        "amount": 1500.0,
        "customer_email": "client@example.com",
        "reference": "Q-2026-014",
    }
    payload.update(overrides)
    return payload


def test_checkout_session_requires_admin_auth(client):
    response = client.post("/api/admin/checkout/session", json=checkout_payload())
    assert response.status_code == 401


def test_checkout_session_fails_when_stripe_not_configured(admin_client, monkeypatch):
    monkeypatch.setattr(server, "STRIPE_SECRET_KEY", "")
    response = admin_client.post("/api/admin/checkout/session", json=checkout_payload())
    assert response.status_code == 503


def test_checkout_session_creates_order(admin_client, monkeypatch):
    monkeypatch.setattr(server, "STRIPE_SECRET_KEY", "sk_test_fake")
    monkeypatch.setattr(server, "STRIPE_CURRENCY", "eur")

    captured = {}

    def fake_create(**kwargs):
        captured.update(kwargs)
        return {"id": "cs_test_123", "url": "https://checkout.stripe.com/pay/cs_test_123"}

    monkeypatch.setattr(server.stripe.checkout.Session, "create", fake_create)

    response = admin_client.post("/api/admin/checkout/session", json=checkout_payload())
    assert response.status_code == 201
    body = response.json()
    assert body == {"id": "cs_test_123", "url": "https://checkout.stripe.com/pay/cs_test_123"}

    assert captured["line_items"][0]["price_data"]["unit_amount"] == 150000
    assert captured["line_items"][0]["price_data"]["currency"] == "eur"
    assert captured["automatic_tax"] == {"enabled": True}
    assert captured["customer_email"] == "client@example.com"

    assert len(server.db.orders.docs) == 1
    order = server.db.orders.docs[0]
    assert order["stripe_session_id"] == "cs_test_123"
    assert order["status"] == "pending"
    assert order["reference"] == "Q-2026-014"


def test_stripe_webhook_rejects_invalid_signature(client, monkeypatch):
    monkeypatch.setattr(server, "STRIPE_SECRET_KEY", "sk_test_fake")
    monkeypatch.setattr(server, "STRIPE_WEBHOOK_SECRET", "whsec_fake")

    def fake_construct_event(payload, sig_header, secret):
        raise server.stripe.error.SignatureVerificationError("bad signature", sig_header)

    monkeypatch.setattr(server.stripe.Webhook, "construct_event", fake_construct_event)

    response = client.post("/api/webhooks/stripe", data=b"{}", headers={"stripe-signature": "bad"})
    assert response.status_code == 400


class ItemOnlyObject:
    """Mimics stripe's StripeObject: supports `obj["key"]` but NOT `obj.get("key")`,
    unlike a plain dict. A real webhook handler that calls `.get()` on the event's
    data object raises AttributeError against the actual SDK - this catches that."""

    def __init__(self, data):
        self._data = data

    def __getitem__(self, key):
        return self._data[key]


def test_stripe_webhook_marks_order_as_paid(client, monkeypatch):
    monkeypatch.setattr(server, "STRIPE_SECRET_KEY", "sk_test_fake")
    monkeypatch.setattr(server, "STRIPE_WEBHOOK_SECRET", "whsec_fake")

    server.db.orders.docs.append({
        "_id": "order-1",
        "stripe_session_id": "cs_test_123",
        "status": "pending",
    })

    fake_event = {
        "type": "checkout.session.completed",
        "data": {"object": ItemOnlyObject({"id": "cs_test_123", "payment_intent": "pi_test_456"})},
    }

    def fake_construct_event(payload, sig_header, secret):
        return fake_event

    monkeypatch.setattr(server.stripe.Webhook, "construct_event", fake_construct_event)

    response = client.post("/api/webhooks/stripe", data=b"{}", headers={"stripe-signature": "valid"})
    assert response.status_code == 200

    order = server.db.orders.docs[0]
    assert order["status"] == "paid"
    assert order["payment_intent"] == "pi_test_456"


def test_legal_pages_are_registered():
    app_js = Path(__file__).parents[1] / "frontend" / "src" / "App.js"
    content = app_js.read_text(encoding="utf-8")
    assert "/privacy-policy" in content
    assert "/legal-notice" in content
    assert "/cookies-policy" in content


# ---------- Contact form with attachment ----------

STEP_SAMPLE = b"ISO-10303-21;\nHEADER;\nFILE_SCHEMA (('AUTOMOTIVE_DESIGN { 1 0 10303 214 3 1 1 }'));\nENDSEC;\nDATA;\nENDSEC;\nEND-ISO-10303-21;\n"


def form_fields(**overrides):
    fields = {
        "name": "Maria Navarro",
        "email": "maria@example.com",
        "message": "I need a machined bracket, 10 pieces in aluminium.",
        "company": "Materials Navarro",
        "quantity": "10",
        "deadline": "4 weeks",
        "material": "Aluminium 6082",
        "has_design": "true",
        "privacyAccepted": "true",
    }
    fields.update(overrides)
    return fields


def test_contact_form_stores_qualifying_fields_and_the_step_file(client, monkeypatch):
    sent = []
    monkeypatch.setattr(server, "schedule_contact_notification", lambda msg, attachment=None: sent.append(attachment))

    response = client.post(
        "/api/contact/form",
        data=form_fields(),
        files={"file": ("part.step", STEP_SAMPLE, "application/octet-stream")},
    )
    assert response.status_code == 201

    doc = server.db.contact_messages.docs[0]
    assert doc["quantity"] == 10
    assert doc["deadline"] == "4 weeks"
    assert doc["material"] == "Aluminium 6082"
    assert doc["has_design"] is True
    assert doc["attachment_name"] == "part.step"
    assert doc["attachment_size"] == len(STEP_SAMPLE)

    stored = server.db.contact_attachments.docs[0]
    assert stored["_id"] == doc["_id"]
    assert bytes(stored["content"]) == STEP_SAMPLE
    assert sent and sent[0]["filename"] == "part.step"


def test_contact_form_works_without_a_file(client):
    response = client.post("/api/contact/form", data=form_fields(quantity="", deadline="", has_design=""))
    assert response.status_code == 201
    doc = server.db.contact_messages.docs[0]
    assert doc["quantity"] is None
    assert doc["has_design"] is None
    assert doc["attachment_name"] is None
    assert server.db.contact_attachments.docs == []


def test_contact_form_rejects_a_disguised_file(client):
    response = client.post(
        "/api/contact/form",
        data=form_fields(),
        files={"file": ("part.step", b"MZ\x90\x00 this is an executable", "application/octet-stream")},
    )
    assert response.status_code == 400
    assert server.db.contact_messages.docs == []


def test_contact_form_rejects_unsupported_extensions(client):
    response = client.post(
        "/api/contact/form",
        data=form_fields(),
        files={"file": ("notes.exe", STEP_SAMPLE, "application/octet-stream")},
    )
    assert response.status_code == 400


def test_contact_form_rejects_oversized_files(client, monkeypatch):
    monkeypatch.setattr(server, "CONTACT_ATTACHMENT_MAX_BYTES", 100)
    response = client.post(
        "/api/contact/form",
        data=form_fields(),
        files={"file": ("big.step", STEP_SAMPLE + b"x" * 200, "application/octet-stream")},
    )
    assert response.status_code == 413


def test_contact_form_accepts_a_pdf(client):
    response = client.post(
        "/api/contact/form",
        data=form_fields(),
        files={"file": ("../../drawing.pdf", b"%PDF-1.4 fake", "application/pdf")},
    )
    assert response.status_code == 201
    assert server.db.contact_messages.docs[0]["attachment_name"] == "drawing.pdf"


def test_contact_form_validates_like_the_json_endpoint(client):
    response = client.post("/api/contact/form", data=form_fields(email="not-an-email"))
    assert response.status_code == 422


def test_contact_form_requires_privacy_when_enabled(client, monkeypatch):
    monkeypatch.setattr(server, "REQUIRE_PRIVACY_ACCEPTANCE", True)
    response = client.post("/api/contact/form", data=form_fields(privacyAccepted="false"))
    assert response.status_code == 400


def test_notification_email_carries_the_attachment_to_resend(monkeypatch):
    captured = {}

    class FakeResponse:
        status = 200

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

        def read(self):
            return b"{}"

    def fake_urlopen(request, timeout=None):
        captured["payload"] = json.loads(request.data.decode("utf-8"))
        return FakeResponse()

    monkeypatch.setattr(server, "RESEND_API_KEY", "re_test")
    monkeypatch.setattr(server, "RESEND_FROM", "Arroyo Systems <notifications@arroyo-systems.com>")
    monkeypatch.setattr(server, "CONTACT_NOTIFICATION_TO", "marcos@arroyo-systems.com")
    monkeypatch.setattr(server.urllib.request, "urlopen", fake_urlopen)

    msg = server.ContactMessage(name="Maria", email="maria@example.com", message="Need a bracket", quantity=5)
    attachment = {"filename": "part.step", "content_type": "model/step", "size": len(STEP_SAMPLE), "data": STEP_SAMPLE}
    server.send_email_message(server.build_contact_notification(msg, attachment))

    payload = captured["payload"]
    assert "Quantity: 5" in payload["text"]
    assert payload["attachments"][0]["filename"] == "part.step"
    import base64
    assert base64.b64decode(payload["attachments"][0]["content"]) == STEP_SAMPLE


def test_admin_can_download_the_attachment(admin_client):
    admin_client.post(
        "/api/contact/form", data=form_fields(), files={"file": ("part.step", STEP_SAMPLE, "application/octet-stream")}
    )
    msg_id = server.db.contact_messages.docs[0]["_id"]
    response = admin_client.get(f"/api/admin/messages/{msg_id}/attachment")
    assert response.status_code == 200
    assert response.content == STEP_SAMPLE
    assert "part.step" in response.headers["content-disposition"]


def test_attachment_download_is_protected(client):
    assert client.get("/api/admin/messages/abc/attachment").status_code == 401
