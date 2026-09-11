import importlib

import pytest
from fastapi.testclient import TestClient

import server

quotes = importlib.import_module("quotes")


class FakeCollection:
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

    def find(self, query=None):
        query = query or {}

        def matches(d):
            for k, v in query.items():
                if isinstance(v, dict) and "$ne" in v:
                    if d.get(k) == v["$ne"]:
                        return False
                elif d.get(k) != v:
                    return False
            return True

        docs = [d for d in self.docs if matches(d)]
        return FakeCursor(docs)


class FakeCursor:
    def __init__(self, docs):
        self._docs = docs

    def sort(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def __aiter__(self):
        self._iter = iter(self._docs)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration


class FakeCounters:
    def __init__(self):
        self.seq = {}

    async def find_one_and_update(self, query, update, upsert=True, return_document=None):
        counter_id = query["_id"]
        self.seq[counter_id] = self.seq.get(counter_id, 0) + update["$inc"]["seq"]
        return {"_id": counter_id, "seq": self.seq[counter_id]}


class FakeDB:
    def __init__(self):
        self.customers = FakeCollection()
        self.quotes = FakeCollection()
        self.orders = FakeCollection()
        self.counters = FakeCounters()


@pytest.fixture()
def db(monkeypatch):
    fake = FakeDB()
    monkeypatch.setattr(server, "db", fake)
    return fake


@pytest.fixture()
def admin_client(db):
    server.app.dependency_overrides[server.get_current_admin] = lambda: "test-admin"
    yield TestClient(server.app)
    server.app.dependency_overrides.pop(server.get_current_admin, None)


def quote_payload(**overrides):
    payload = {
        "customer": {
            "company_name": "XYZ Engineering",
            "contact_person": "Jane Doe",
            "email": "jane@xyz-engineering.com",
            "billing_address": "123 Industrial Ave",
            "vat_id": "DE123456789",
        },
        "project_name": "Structural Bracket",
        "vat_rate": 0.21,
        "items": [
            {"type": "package", "product_key": "product_development"},
            {"type": "engineering_hours", "quantity": 5, "description": "Extra structural review"},
        ],
    }
    payload.update(overrides)
    return payload


def test_create_quote_matches_prompt_example(admin_client):
    response = admin_client.post("/api/admin/quotes", json=quote_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["subtotal"] == 3250.0
    assert body["vat_amount"] == 682.5
    assert body["total"] == 3932.5
    # Deposit is 50% of the package (Product Development) only, incl. VAT: 3000 * 1.21 / 2.
    # Engineering Hours always land in the remaining/second payment, never split.
    assert body["deposit_amount"] == 1815.0
    assert body["remaining_amount"] == 2117.5
    assert body["deposit_amount"] + body["remaining_amount"] == body["total"]
    assert body["status"] == "DRAFT"
    assert body["payment_status"] == "UNPAID"
    assert body["quote_number"].startswith("AS-")


def test_quote_numbers_increment_without_duplicates(admin_client):
    numbers = set()
    for _ in range(5):
        response = admin_client.post("/api/admin/quotes", json=quote_payload())
        numbers.add(response.json()["quote_number"])
    assert len(numbers) == 5


def test_create_quote_requires_customer(admin_client):
    payload = quote_payload()
    del payload["customer"]
    response = admin_client.post("/api/admin/quotes", json=payload)
    assert response.status_code == 422


def test_create_quote_requires_at_least_one_item(admin_client):
    response = admin_client.post("/api/admin/quotes", json=quote_payload(items=[]))
    assert response.status_code == 422


def test_create_quote_rejects_negative_engineering_hours(admin_client):
    payload = quote_payload(items=[{"type": "engineering_hours", "quantity": -1}])
    response = admin_client.post("/api/admin/quotes", json=payload)
    assert response.status_code == 422


def test_create_quote_rejects_extra_hours_beyond_package_max_without_override(admin_client):
    payload = quote_payload(items=[{"type": "package", "product_key": "product_design", "extra_hours": 20}])
    response = admin_client.post("/api/admin/quotes", json=payload)
    assert response.status_code == 422


def test_create_quote_allows_extra_hours_beyond_max_with_override(admin_client):
    payload = quote_payload(
        items=[{"type": "package", "product_key": "product_design", "extra_hours": 20, "override_confirmed": True}]
    )
    response = admin_client.post("/api/admin/quotes", json=payload)
    assert response.status_code == 201
    assert response.json()["items"][0]["total"] == 1300.0 + 20 * 50.0


def test_quote_requires_admin_auth(db):
    client = TestClient(server.app)
    response = client.post("/api/admin/quotes", json=quote_payload())
    assert response.status_code == 401


def test_edit_blocked_after_deposit_paid(admin_client, db):
    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    for d in db.quotes.docs:
        if d["_id"] == quote["id"]:
            d["payment_status"] = "DEPOSIT_PAID"
            d["status"] = "IN_PROGRESS"

    response = admin_client.patch(f"/api/admin/quotes/{quote['id']}", json=quote_payload())
    assert response.status_code == 409


def test_edit_allowed_while_draft(admin_client):
    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    response = admin_client.patch(
        f"/api/admin/quotes/{quote['id']}",
        json=quote_payload(project_name="Updated Bracket Name"),
    )
    assert response.status_code == 200
    assert response.json()["project_name"] == "Updated Bracket Name"


def test_versioning_voids_the_previous_quote_and_keeps_same_number(admin_client):
    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    version2 = admin_client.post(f"/api/admin/quotes/{quote['id']}/versions").json()

    assert version2["version"] == 2
    assert version2["quote_number"] == quote["quote_number"]
    assert version2["supersedes_id"] == quote["id"]

    original = admin_client.get(f"/api/admin/quotes/{quote['id']}").json()
    assert original["status"] == "VOID"


def test_versioning_blocked_once_deposit_paid(admin_client, db):
    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    for d in db.quotes.docs:
        if d["_id"] == quote["id"]:
            d["payment_status"] = "DEPOSIT_PAID"

    response = admin_client.post(f"/api/admin/quotes/{quote['id']}/versions")
    assert response.status_code == 409


def test_public_quote_unauthorized_token_returns_404(db):
    client = TestClient(server.app)
    response = client.get("/api/quotes/public/does-not-exist")
    assert response.status_code == 404


def test_public_view_transitions_sent_to_viewed(admin_client, db):
    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    admin_client.post(f"/api/admin/quotes/{quote['id']}/send")

    client = TestClient(server.app)
    token = next(d["public_token"] for d in db.quotes.docs if d["_id"] == quote["id"])

    response = client.get(f"/api/quotes/public/{token}")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "VIEWED"
    assert "notes" not in body
    assert "public_token" not in body
    assert "created_by" not in body


def test_pdf_amount_matches_quote_total(admin_client, db, monkeypatch):
    captured = {}

    def fake_build_pdf(quote, customer):
        captured["quote_total"] = quote["total"]
        return b"%PDF-1.4 fake"

    monkeypatch.setattr(quotes, "build_quote_pdf", fake_build_pdf)

    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    response = admin_client.get(f"/api/admin/quotes/{quote['id']}/pdf")
    assert response.status_code == 200
    assert captured["quote_total"] == quote["total"] == 3932.5


def test_pay_deposit_stripe_amount_matches_quote(admin_client, db, monkeypatch):
    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    admin_client.post(f"/api/admin/quotes/{quote['id']}/send")
    quote_doc = next(d for d in db.quotes.docs if d["_id"] == quote["id"])
    quote_doc["contract_status"] = "SIGNED"  # deposit requires a signed contract
    token = quote_doc["public_token"]

    monkeypatch.setattr(server, "STRIPE_SECRET_KEY", "sk_test_fake")
    captured = {}

    def fake_create(**kwargs):
        captured.update(kwargs)
        return {"id": "cs_test_deposit", "url": "https://checkout.stripe.com/pay/cs_test_deposit"}

    monkeypatch.setattr(server.stripe.checkout.Session, "create", fake_create)

    client = TestClient(server.app)
    response = client.post(f"/api/quotes/public/{token}/pay-deposit")
    assert response.status_code == 200

    # Stripe must be charged exactly the deposit amount shown to the client, in cents.
    assert captured["line_items"][0]["price_data"]["unit_amount"] == round(quote["deposit_amount"] * 100)
    assert captured["metadata"]["quote_id"] == quote["id"]
    assert captured["metadata"]["payment_type"] == "deposit"

    order = next(o for o in db.orders.docs if o["quote_id"] == quote["id"])
    assert order["amount"] == quote["deposit_amount"]

    updated = next(d for d in db.quotes.docs if d["_id"] == quote["id"])
    assert updated["status"] == "ACCEPTED"


def test_pay_final_only_allowed_after_final_payment_requested(admin_client, db):
    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    token = next(d["public_token"] for d in db.quotes.docs if d["_id"] == quote["id"])

    client = TestClient(server.app)
    response = client.post(f"/api/quotes/public/{token}/pay-final")
    assert response.status_code == 409


def test_request_final_payment_requires_deposit_paid(admin_client):
    quote = admin_client.post("/api/admin/quotes", json=quote_payload(items=[
        {"type": "package", "product_key": "product_design"},
    ])).json()
    response = admin_client.post(
        f"/api/admin/quotes/{quote['id']}/request-final-payment", json={"additional_items": []}
    )
    assert response.status_code == 409


def test_request_final_payment_can_add_engineering_hours_without_touching_deposit(admin_client, db):
    quote = admin_client.post("/api/admin/quotes", json=quote_payload(items=[
        {"type": "package", "product_key": "product_design"},
    ])).json()
    original_deposit = quote["deposit_amount"]
    original_remaining = quote["remaining_amount"]

    for d in db.quotes.docs:
        if d["_id"] == quote["id"]:
            d["status"] = "IN_PROGRESS"
            d["payment_status"] = "DEPOSIT_PAID"

    response = admin_client.post(
        f"/api/admin/quotes/{quote['id']}/request-final-payment",
        json={"additional_items": [{"type": "engineering_hours", "quantity": 3, "description": "Delay rework"}]},
    )
    assert response.status_code == 200
    body = response.json()

    assert body["status"] == "FINAL_PAYMENT_REQUESTED"
    # Deposit already charged must never change - only Engineering Hours are addable here,
    # and deposit_amount depends solely on package items.
    assert body["deposit_amount"] == original_deposit
    # 3h x EUR50 = EUR150 excl. VAT; quote_payload() defaults to 21% VAT.
    assert body["remaining_amount"] == round(original_remaining + 3 * 50.0 * 1.21, 2)
    assert len(body["items"]) == 2
    assert any(item["type"] == "engineering_hours" and item["quantity"] == 3 for item in body["items"])


def test_request_final_payment_rejects_package_as_additional_item(admin_client, db):
    quote = admin_client.post("/api/admin/quotes", json=quote_payload(items=[
        {"type": "package", "product_key": "product_design"},
    ])).json()
    for d in db.quotes.docs:
        if d["_id"] == quote["id"]:
            d["status"] = "IN_PROGRESS"
            d["payment_status"] = "DEPOSIT_PAID"

    response = admin_client.post(
        f"/api/admin/quotes/{quote['id']}/request-final-payment",
        json={"additional_items": [{"type": "package", "product_key": "product_development"}]},
    )
    assert response.status_code == 422


def test_webhook_confirms_deposit_and_is_idempotent(admin_client, db, monkeypatch):
    quote = admin_client.post("/api/admin/quotes", json=quote_payload()).json()
    admin_client.post(f"/api/admin/quotes/{quote['id']}/send")

    db.orders.docs.append({
        "_id": "order-1",
        "stripe_session_id": "cs_test_deposit_webhook",
        "quote_id": quote["id"],
        "payment_type": "deposit",
        "status": "pending",
    })

    monkeypatch.setattr(server, "STRIPE_SECRET_KEY", "sk_test_fake")
    monkeypatch.setattr(server, "STRIPE_WEBHOOK_SECRET", "whsec_fake")

    fake_event = {
        "type": "checkout.session.completed",
        "data": {"object": {"id": "cs_test_deposit_webhook", "payment_intent": "pi_test_1"}},
    }
    monkeypatch.setattr(server.stripe.Webhook, "construct_event", lambda *a, **k: fake_event)

    client = TestClient(server.app)
    first = client.post("/api/webhooks/stripe", data=b"{}", headers={"stripe-signature": "valid"})
    assert first.status_code == 200

    updated = next(d for d in db.quotes.docs if d["_id"] == quote["id"])
    assert updated["status"] == "IN_PROGRESS"
    assert updated["payment_status"] == "DEPOSIT_PAID"
    orders_after_first = len(db.orders.docs)

    # A resent webhook for the same event must not error, duplicate the order, or move the
    # quote past IN_PROGRESS/DEPOSIT_PAID.
    second = client.post("/api/webhooks/stripe", data=b"{}", headers={"stripe-signature": "valid"})
    assert second.status_code == 200
    assert len(db.orders.docs) == orders_after_first
    updated_again = next(d for d in db.quotes.docs if d["_id"] == quote["id"])
    assert updated_again["status"] == "IN_PROGRESS"
    assert updated_again["payment_status"] == "DEPOSIT_PAID"
