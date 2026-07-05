from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import io
import csv
import uuid
import hashlib
import smtplib
import json
import re
import time
import asyncio
import urllib.error
import urllib.parse
import urllib.request
from email.message import EmailMessage
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from typing import Optional, Literal
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from starlette.concurrency import run_in_threadpool
import jwt


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ---------- Config ----------
mongo_url = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me')
JWT_ALGO = 'HS256'
JWT_EXPIRE_MINUTES = 60 * 24  # 24 h

ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin')
PRIVACY_POLICY_VERSION = os.environ.get('PRIVACY_POLICY_VERSION', 'v1.0')
REQUIRE_PRIVACY_ACCEPTANCE = os.environ.get('REQUIRE_PRIVACY_ACCEPTANCE', 'true').lower() == 'true'
TURNSTILE_SECRET_KEY = os.environ.get('TURNSTILE_SECRET_KEY', '').strip()
RATE_LIMIT_CONTACT_MAX = int(os.environ.get('RATE_LIMIT_CONTACT_MAX', '5'))
RATE_LIMIT_CONTACT_WINDOW_SECONDS = int(os.environ.get('RATE_LIMIT_CONTACT_WINDOW_SECONDS', '60'))
IP_HASH_SALT = os.environ.get('IP_HASH_SALT', JWT_SECRET)
SMTP_HOST = os.environ.get('SMTP_HOST', '').strip()
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '').strip()
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '').strip()
SMTP_FROM = os.environ.get('SMTP_FROM', SMTP_USERNAME or 'contact@arroyo-systems.com').strip()
CONTACT_NOTIFICATION_TO = os.environ.get('CONTACT_NOTIFICATION_TO', 'contact@arroyo-systems.com').strip()
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '').strip()
RESEND_FROM = os.environ.get('RESEND_FROM', SMTP_FROM).strip()
EMAIL_SEND_TIMEOUT_SECONDS = int(os.environ.get('EMAIL_SEND_TIMEOUT_SECONDS', '5'))
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get('CORS_ORIGINS', '*').split(',')
    if origin.strip()
]

client = AsyncIOMotorClient(mongo_url)
db = client[DB_NAME]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/login", auto_error=False)

app = FastAPI(title="Arroyo Systems API")
api_router = APIRouter(prefix="/api")
_contact_rate_limits: dict[str, list[float]] = {}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("arroyo")


# ---------- Models ----------
ProjectType = Literal["DFM", "Structural Validation", "Engineering Performance", "Other"]
TAG_RE = re.compile(r"<[^>]*>")
CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
URL_RE = re.compile(r"https?://|www\.", re.IGNORECASE)


def sanitize_text(value: str) -> str:
    value = CONTROL_RE.sub("", value)
    value = TAG_RE.sub("", value)
    return " ".join(value.strip().split())


def sanitize_message(value: str) -> str:
    value = CONTROL_RE.sub("", value)
    value = TAG_RE.sub("", value)
    return "\n".join(line.strip() for line in value.strip().splitlines()).strip()


class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    company: Optional[str] = Field(default=None, max_length=120)
    project_type: Optional[ProjectType] = None
    message: str = Field(min_length=1, max_length=4000)
    privacyAccepted: Optional[bool] = None
    turnstileToken: Optional[str] = Field(default=None, max_length=2048)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = sanitize_text(value)
        if len(value) < 2:
            raise ValueError("Name is too short")
        return value

    @field_validator("company")
    @classmethod
    def validate_company(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = sanitize_text(value)
        return value or None

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        value = sanitize_message(value)
        if len(value) < 10:
            raise ValueError("Message is too short")
        if len(URL_RE.findall(value)) > 2:
            raise ValueError("Message contains too many links")
        return value


class ContactMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    name: str
    email: str
    company: Optional[str] = None
    project_type: Optional[str] = None
    message: str
    read: bool = False
    privacyAccepted: bool = False
    privacyAcceptedAt: Optional[datetime] = None
    privacyPolicyVersion: str = PRIVACY_POLICY_VERSION
    ipHash: Optional[str] = None
    userAgent: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ContactSubmitResponse(BaseModel):
    id: str
    created_at: datetime
    status: str = "received"


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminMe(BaseModel):
    username: str


class UpdateMessage(BaseModel):
    read: bool


# ---------- Helpers ----------
def hash_password(p: str) -> str:
    return pwd_context.hash(p)


def verify_password(p: str, h: str) -> bool:
    try:
        return pwd_context.verify(p, h)
    except Exception:
        return False


def create_access_token(username: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": username, "exp": exp}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def hash_ip(ip: str) -> str:
    raw = f"{IP_HASH_SALT}:{ip}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def check_contact_rate_limit(ip: str) -> None:
    now = time.time()
    window_start = now - RATE_LIMIT_CONTACT_WINDOW_SECONDS
    hits = [ts for ts in _contact_rate_limits.get(ip, []) if ts >= window_start]
    if len(hits) >= RATE_LIMIT_CONTACT_MAX:
        raise HTTPException(status_code=429, detail="Too many requests")
    hits.append(now)
    _contact_rate_limits[ip] = hits


async def verify_turnstile(token: Optional[str], ip: str) -> None:
    if not TURNSTILE_SECRET_KEY:
        return
    if not token:
        raise HTTPException(status_code=400, detail="Missing anti-spam token")

    data = urllib.parse.urlencode({
        "secret": TURNSTILE_SECRET_KEY,
        "response": token,
        "remoteip": ip,
    }).encode("utf-8")
    request = urllib.request.Request(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            result = json.loads(response.read().decode("utf-8"))
    except Exception:
        logger.exception("Turnstile verification failed")
        raise HTTPException(status_code=400, detail="Could not verify anti-spam token")

    if not result.get("success"):
        raise HTTPException(status_code=400, detail="Invalid anti-spam token")


def is_email_notifications_enabled() -> bool:
    return bool(CONTACT_NOTIFICATION_TO and (
        RESEND_API_KEY or (SMTP_HOST and SMTP_USERNAME and SMTP_PASSWORD)
    ))


def get_smtp_password() -> str:
    # Google app passwords are often displayed in groups. SMTP expects the raw value.
    return SMTP_PASSWORD.replace(" ", "")


def build_contact_notification(msg: ContactMessage) -> EmailMessage:
    email = EmailMessage()
    email["Subject"] = f"New Arroyo Systems contact request: {msg.name}"
    email["From"] = RESEND_FROM if RESEND_API_KEY else SMTP_FROM
    email["To"] = CONTACT_NOTIFICATION_TO
    email["Reply-To"] = msg.email
    email.set_content(
        "\n".join([
            "A new contact request has been submitted from arroyo-systems.com.",
            "",
            f"Name: {msg.name}",
            f"Email: {msg.email}",
            f"Company: {msg.company or '-'}",
            f"Project type: {msg.project_type or '-'}",
            f"Privacy accepted: {'yes' if msg.privacyAccepted else 'no'}",
            f"Privacy policy version: {msg.privacyPolicyVersion}",
            "",
            "Message:",
            msg.message,
            "",
            "Open the admin panel:",
            "https://arroyo-systems.com/admin",
        ])
    )
    return email


def send_email_via_resend(email: EmailMessage) -> None:
    payload = {
        "from": RESEND_FROM,
        "to": [CONTACT_NOTIFICATION_TO],
        "subject": email["Subject"],
        "text": email.get_content(),
    }
    request = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "ArroyoSystemsAPI/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=EMAIL_SEND_TIMEOUT_SECONDS) as response:
            if response.status >= 400:
                raise RuntimeError(response.read().decode("utf-8"))
            logger.info("Contact email notification accepted by Resend")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8")
        raise RuntimeError(detail or str(exc)) from exc


def send_email_message(email: EmailMessage) -> None:
    if RESEND_API_KEY:
        send_email_via_resend(email)
        return

    smtp_class = smtplib.SMTP_SSL if SMTP_PORT == 465 else smtplib.SMTP
    with smtp_class(SMTP_HOST, SMTP_PORT, timeout=EMAIL_SEND_TIMEOUT_SECONDS) as smtp:
        if SMTP_PORT != 465:
            smtp.starttls()
        smtp.login(SMTP_USERNAME, get_smtp_password())
        smtp.send_message(email)
        logger.info("Contact email notification sent via SMTP")


def send_contact_notification(msg: ContactMessage) -> None:
    if not is_email_notifications_enabled():
        logger.info("Contact email notification skipped because SMTP is not configured")
        return

    send_email_message(build_contact_notification(msg))


async def notify_contact_message(msg: ContactMessage) -> None:
    try:
        await run_in_threadpool(send_contact_notification, msg)
    except Exception:
        logger.exception("Could not send contact notification email")


def schedule_contact_notification(msg: ContactMessage) -> None:
    asyncio.create_task(notify_contact_message(msg))


async def get_current_admin(token: Optional[str] = Depends(oauth2_scheme)) -> str:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exc

    username: Optional[str] = None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        username = payload.get("sub")
    except jwt.PyJWTError:
        raise credentials_exc

    if not username:
        raise credentials_exc

    admin = await db.admin_users.find_one({"username": username})
    if not admin:
        raise credentials_exc
    return username


def _serialize_message(doc: dict) -> dict:
    """Ensure Mongo _id and datetime are safely returned."""
    out = dict(doc)
    if "_id" in out:
        out["id"] = out.pop("_id")
    for key in ("created_at", "privacyAcceptedAt"):
        if isinstance(out.get(key), datetime):
            out[key] = out[key].isoformat()
    return out


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
        )
        return response


# ---------- Startup ----------
@app.on_event("startup")
async def on_startup():
    if os.environ.get("SKIP_DB_STARTUP", "false").lower() == "true":
        return

    # Ensure indexes
    await db.contact_messages.create_index("created_at")
    await db.admin_users.create_index("username", unique=True)

    # Keep the configured admin account in sync with deployment secrets.
    existing = await db.admin_users.find_one({"username": ADMIN_USERNAME})
    if not existing:
        await db.admin_users.insert_one({
            "_id": str(uuid.uuid4()),
            "username": ADMIN_USERNAME,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "created_at": datetime.now(timezone.utc),
        })
        logger.info(f"Seeded admin user '{ADMIN_USERNAME}'")
    else:
        await db.admin_users.update_one(
            {"username": ADMIN_USERNAME},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
        )
        logger.info(f"Updated admin user '{ADMIN_USERNAME}' from environment")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ---------- Public routes ----------
@api_router.get("/")
async def root():
    return {"service": "Arroyo Systems API", "status": "ok"}


@api_router.post("/contact", response_model=ContactSubmitResponse, status_code=201)
async def submit_contact(payload: ContactCreate, request: Request):
    ip = get_client_ip(request)
    check_contact_rate_limit(ip)
    await verify_turnstile(payload.turnstileToken, ip)
    if REQUIRE_PRIVACY_ACCEPTANCE and payload.privacyAccepted is not True:
        raise HTTPException(status_code=400, detail="Privacy policy acceptance is required")

    privacy_accepted_at = datetime.now(timezone.utc) if payload.privacyAccepted else None
    msg = ContactMessage(
        name=payload.name,
        email=str(payload.email).lower().strip(),
        company=payload.company,
        project_type=payload.project_type,
        message=payload.message,
        privacyAccepted=bool(payload.privacyAccepted),
        privacyAcceptedAt=privacy_accepted_at,
        privacyPolicyVersion=PRIVACY_POLICY_VERSION,
        ipHash=hash_ip(ip),
        userAgent=request.headers.get("user-agent", "")[:300] or None,
    )
    doc = msg.model_dump(by_alias=True)
    await db.contact_messages.insert_one(doc)
    try:
        schedule_contact_notification(msg)
    except Exception:
        logger.exception("Could not schedule contact notification email")
    logger.info(f"New contact message from {msg.email}")
    return ContactSubmitResponse(id=msg.id, created_at=msg.created_at)


# ---------- Admin routes ----------
@api_router.post("/admin/login", response_model=TokenResponse)
async def admin_login(payload: LoginRequest):
    admin = await db.admin_users.find_one({"username": payload.username})
    if not admin or not verify_password(payload.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(payload.username)
    return TokenResponse(access_token=token)


@api_router.get("/admin/me", response_model=AdminMe)
async def admin_me(current: str = Depends(get_current_admin)):
    return AdminMe(username=current)


@api_router.get("/admin/email/status")
async def email_status(current: str = Depends(get_current_admin)):
    return {
        "enabled": is_email_notifications_enabled(),
        "smtp_host_set": bool(SMTP_HOST),
        "smtp_port": SMTP_PORT,
        "smtp_username_set": bool(SMTP_USERNAME),
        "smtp_from": SMTP_FROM,
        "contact_notification_to": CONTACT_NOTIFICATION_TO,
        "smtp_password_set": bool(SMTP_PASSWORD),
        "resend_api_key_set": bool(RESEND_API_KEY),
        "resend_from": RESEND_FROM,
        "email_send_timeout_seconds": EMAIL_SEND_TIMEOUT_SECONDS,
        "provider": "resend" if RESEND_API_KEY else "smtp",
    }


@api_router.post("/admin/email/test")
async def test_email(current: str = Depends(get_current_admin)):
    if not is_email_notifications_enabled():
        raise HTTPException(status_code=400, detail="SMTP is not fully configured")

    email = EmailMessage()
    email["Subject"] = "Arroyo Systems email test"
    email["From"] = RESEND_FROM if RESEND_API_KEY else SMTP_FROM
    email["To"] = CONTACT_NOTIFICATION_TO
    email.set_content(
        "This is a test email from the Arroyo Systems backend.\n\n"
        "If you received this message, email notifications are configured correctly."
    )

    try:
        await run_in_threadpool(send_email_message, email)
    except Exception as exc:
        logger.exception("Email test failed")
        raise HTTPException(status_code=502, detail=f"Email test failed: {exc}") from exc

    return {"status": "sent", "to": CONTACT_NOTIFICATION_TO}


@api_router.get("/admin/messages")
async def list_messages(current: str = Depends(get_current_admin)):
    cursor = db.contact_messages.find({}).sort("created_at", -1).limit(1000)
    items = []
    async for d in cursor:
        items.append(_serialize_message(d))
    return {"items": items, "total": len(items), "unread": sum(1 for x in items if not x.get("read"))}


@api_router.patch("/admin/messages/{msg_id}")
async def update_message(msg_id: str, patch: UpdateMessage, current: str = Depends(get_current_admin)):
    result = await db.contact_messages.update_one(
        {"_id": msg_id}, {"$set": {"read": patch.read}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    doc = await db.contact_messages.find_one({"_id": msg_id})
    return _serialize_message(doc)


@api_router.delete("/admin/messages/{msg_id}", status_code=204)
async def delete_message(msg_id: str, current: str = Depends(get_current_admin)):
    result = await db.contact_messages.delete_one({"_id": msg_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return Response(status_code=204)


@api_router.get("/admin/messages/export.csv")
async def export_messages_csv(current: str = Depends(get_current_admin)):
    cursor = db.contact_messages.find({}).sort("created_at", -1).limit(10000)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "id", "created_at", "name", "email", "company", "project_type", "read",
        "privacyAccepted", "privacyAcceptedAt", "privacyPolicyVersion", "message",
    ])
    async for d in cursor:
        writer.writerow([
            d.get("_id"),
            d.get("created_at").isoformat() if isinstance(d.get("created_at"), datetime) else d.get("created_at"),
            d.get("name", ""),
            d.get("email", ""),
            d.get("company", "") or "",
            d.get("project_type", "") or "",
            "yes" if d.get("read") else "no",
            "yes" if d.get("privacyAccepted") else "no",
            d.get("privacyAcceptedAt").isoformat() if isinstance(d.get("privacyAcceptedAt"), datetime) else d.get("privacyAcceptedAt", ""),
            d.get("privacyPolicyVersion", "") or "",
            (d.get("message", "") or "").replace("\n", " "),
        ])
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=arroyo_messages.csv"},
    )


# Include router
app.include_router(api_router)
app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
