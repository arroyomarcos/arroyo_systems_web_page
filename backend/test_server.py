import importlib
import json
import os
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


class FakeDB:
    def __init__(self):
        self.contact_messages = FakeContactMessages()


@pytest.fixture()
def client(monkeypatch):
    server._contact_rate_limits.clear()
    monkeypatch.setattr(server, "db", FakeDB())
    monkeypatch.setattr(server, "TURNSTILE_SECRET_KEY", "")
    monkeypatch.setattr(server, "REQUIRE_PRIVACY_ACCEPTANCE", False)
    return TestClient(server.app)


def valid_payload(**overrides):
    payload = {
        "name": "Maria Navarro",
        "email": "maria@example.com",
        "company": "Materials Navarro",
        "project_type": "DFM",
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

    async def fake_notify(message):
        calls.append(message.email)

    monkeypatch.setattr(server, "notify_contact_message", fake_notify)
    response = client.post("/api/contact", json=valid_payload(email="notify@example.com"))
    assert response.status_code == 201
    assert calls == ["notify@example.com"]


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


def test_contact_rejects_invalid_email(client):
    response = client.post("/api/contact", json=valid_payload(email="not-an-email"))
    assert response.status_code == 422


def test_contact_rejects_too_long_message(client):
    response = client.post("/api/contact", json=valid_payload(message="x" * 4001))
    assert response.status_code == 422


def test_admin_messages_are_protected(client):
    response = client.get("/api/admin/messages")
    assert response.status_code == 401


def test_legal_pages_are_registered():
    app_js = Path(__file__).parents[1] / "frontend" / "src" / "App.js"
    content = app_js.read_text(encoding="utf-8")
    assert "/privacy-policy" in content
    assert "/legal-notice" in content
    assert "/cookies-policy" in content
