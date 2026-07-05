import importlib
import os
from pathlib import Path

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
