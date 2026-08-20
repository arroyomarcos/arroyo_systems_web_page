"""DocuSign eSignature REST API client: JWT Grant auth (server-to-server), envelope creation
from a PDF we generate ourselves, embedded ("recipient view") signing URLs, and Connect webhook
HMAC verification.

Pure client module - no DB access. All calls are synchronous (urllib, matching the style
already used in server.py for Turnstile/Resend); callers wrap these in `run_in_threadpool`,
same as Stripe calls elsewhere.
"""
import base64
import hashlib
import hmac
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Optional

import jwt

DOCUSIGN_INTEGRATION_KEY = os.environ.get("DOCUSIGN_INTEGRATION_KEY", "").strip()
DOCUSIGN_USER_ID = os.environ.get("DOCUSIGN_USER_ID", "").strip()
DOCUSIGN_PRIVATE_KEY_B64 = os.environ.get("DOCUSIGN_PRIVATE_KEY_B64", "").strip()
DOCUSIGN_AUTH_HOST = os.environ.get("DOCUSIGN_AUTH_HOST", "account-d.docusign.com").strip()
DOCUSIGN_HMAC_KEY = os.environ.get("DOCUSIGN_HMAC_KEY", "").strip()

SIGNER_RECIPIENT_ID = "1"
_JWT_TTL_SECONDS = 3600
_TOKEN_REFRESH_MARGIN_SECONDS = 15 * 60

_token_cache: dict = {}


class DocuSignError(RuntimeError):
    """Raised when DocuSign is not configured, or a DocuSign API call fails."""


def is_configured() -> bool:
    return bool(DOCUSIGN_INTEGRATION_KEY and DOCUSIGN_USER_ID and DOCUSIGN_PRIVATE_KEY_B64)


def _require_configured() -> None:
    if not is_configured():
        raise DocuSignError("DocuSign is not configured on this server")


def _private_key_pem() -> bytes:
    return base64.b64decode(DOCUSIGN_PRIVATE_KEY_B64)


def _build_jwt_assertion() -> str:
    now = int(time.time())
    payload = {
        "iss": DOCUSIGN_INTEGRATION_KEY,
        "sub": DOCUSIGN_USER_ID,
        "aud": DOCUSIGN_AUTH_HOST,
        "scope": "signature impersonation",
        "iat": now,
        "exp": now + _JWT_TTL_SECONDS,
    }
    return jwt.encode(payload, _private_key_pem(), algorithm="RS256")


def _request_json(url: str, *, method: str, data: Optional[bytes], headers: dict) -> dict:
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8")
        raise DocuSignError(f"DocuSign API error ({exc.code}) for {url}: {detail}") from exc


def _fetch_token() -> dict:
    _require_configured()
    assertion = _build_jwt_assertion()
    form = urllib.parse.urlencode({
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": assertion,
    }).encode("utf-8")
    token_data = _request_json(
        f"https://{DOCUSIGN_AUTH_HOST}/oauth/token",
        method="POST",
        data=form,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    access_token = token_data["access_token"]

    userinfo = _request_json(
        f"https://{DOCUSIGN_AUTH_HOST}/oauth/userinfo",
        method="GET",
        data=None,
        headers={"Authorization": f"Bearer {access_token}"},
    )
    accounts = userinfo.get("accounts", [])
    account = next((a for a in accounts if a.get("is_default")), accounts[0] if accounts else None)
    if not account:
        raise DocuSignError("DocuSign userinfo returned no accounts for this user")

    return {
        "access_token": access_token,
        "account_id": account["account_id"],
        "base_uri": account["base_uri"],
        "expires_at": time.time() + _JWT_TTL_SECONDS,
    }


def get_access_token() -> dict:
    """Returns {access_token, account_id, base_uri}, refreshing ~15 min before the 1h expiry.
    DocuSign issues no refresh token for JWT Grant - refreshing means signing a brand new JWT."""
    cached = _token_cache.get("value")
    if cached and cached["expires_at"] - time.time() > _TOKEN_REFRESH_MARGIN_SECONDS:
        return cached
    fresh = _fetch_token()
    _token_cache["value"] = fresh
    return fresh


def create_envelope(
    *,
    pdf_bytes: bytes,
    contract_number: str,
    signer_email: str,
    signer_name: str,
    client_user_id: str,
    webhook_url: Optional[str] = None,
) -> str:
    """Creates and sends an envelope for one embedded signer, using anchor-string tabs so
    placement survives minor changes to pdf_contract.py's layout. Returns the envelope id."""
    token = get_access_token()

    envelope_definition = {
        "emailSubject": f"Arroyo Systems - Contract {contract_number}",
        "status": "sent",
        "documents": [{
            "documentId": "1",
            "name": f"{contract_number}.pdf",
            "fileExtension": "pdf",
            "documentBase64": base64.b64encode(pdf_bytes).decode("ascii"),
        }],
        "recipients": {
            "signers": [{
                "email": signer_email,
                "name": signer_name,
                "recipientId": SIGNER_RECIPIENT_ID,
                "routingOrder": "1",
                "clientUserId": client_user_id,
                "tabs": {
                    "signHereTabs": [{
                        "anchorString": "/firma_cliente/",
                        "anchorUnits": "pixels",
                        "anchorXOffset": "0",
                        "anchorYOffset": "-10",
                        "anchorIgnoreIfNotPresent": "false",
                    }],
                    "dateSignedTabs": [{
                        "anchorString": "/fecha_firma/",
                        "anchorUnits": "pixels",
                        "anchorXOffset": "0",
                        "anchorYOffset": "-10",
                        "anchorIgnoreIfNotPresent": "false",
                    }],
                },
            }],
        },
    }
    if webhook_url:
        # Field-level shape confirmed against a real sandbox payload before Go-Live (see plan).
        envelope_definition["eventNotification"] = {
            "url": webhook_url,
            "requireAcknowledgment": "true",
            "envelopeEvents": [{"envelopeEventStatusCode": "completed"}],
            "eventData": {"version": "restv2.1", "format": "json"},
        }

    response = _request_json(
        f"{token['base_uri']}/restapi/v2.1/accounts/{token['account_id']}/envelopes",
        method="POST",
        data=json.dumps(envelope_definition).encode("utf-8"),
        headers={"Authorization": f"Bearer {token['access_token']}", "Content-Type": "application/json"},
    )
    return response["envelopeId"]


def get_recipient_view_url(
    *, envelope_id: str, signer_email: str, signer_name: str, client_user_id: str, return_url: str
) -> str:
    """Single-use embedded-signing URL, expires in 300s - always call this fresh, never cache."""
    token = get_access_token()
    body = {
        "returnUrl": return_url,
        "authenticationMethod": "none",
        "email": signer_email,
        "userName": signer_name,
        "clientUserId": client_user_id,
        "recipientId": SIGNER_RECIPIENT_ID,
    }
    response = _request_json(
        f"{token['base_uri']}/restapi/v2.1/accounts/{token['account_id']}/envelopes/{envelope_id}/views/recipient",
        method="POST",
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {token['access_token']}", "Content-Type": "application/json"},
    )
    return response["url"]


def verify_webhook_signature(raw_body: bytes, signature_b64: str) -> bool:
    if not DOCUSIGN_HMAC_KEY or not signature_b64:
        return False
    computed = hmac.new(DOCUSIGN_HMAC_KEY.encode("utf-8"), raw_body, hashlib.sha256).digest()
    computed_b64 = base64.b64encode(computed).decode("ascii")
    return hmac.compare_digest(computed_b64, signature_b64)
