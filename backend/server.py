from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import io
import csv
import uuid
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
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

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("arroyo")


# ---------- Models ----------
ProjectType = Literal["DFM", "Structural Validation", "Engineering Performance", "Other"]


class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    company: Optional[str] = Field(default=None, max_length=120)
    project_type: Optional[ProjectType] = None
    message: str = Field(min_length=1, max_length=4000)


class ContactMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    name: str
    email: str
    company: Optional[str] = None
    project_type: Optional[str] = None
    message: str
    read: bool = False
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
    if isinstance(out.get("created_at"), datetime):
        out["created_at"] = out["created_at"].isoformat()
    return out


# ---------- Startup ----------
@app.on_event("startup")
async def on_startup():
    # Ensure indexes
    await db.contact_messages.create_index("created_at")
    await db.admin_users.create_index("username", unique=True)

    # Seed admin if none exists
    existing = await db.admin_users.find_one({"username": ADMIN_USERNAME})
    if not existing:
        await db.admin_users.insert_one({
            "_id": str(uuid.uuid4()),
            "username": ADMIN_USERNAME,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "created_at": datetime.now(timezone.utc),
        })
        logger.info(f"Seeded admin user '{ADMIN_USERNAME}'")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ---------- Public routes ----------
@api_router.get("/")
async def root():
    return {"service": "Arroyo Systems API", "status": "ok"}


@api_router.post("/contact", response_model=ContactSubmitResponse, status_code=201)
async def submit_contact(payload: ContactCreate):
    msg = ContactMessage(
        name=payload.name.strip(),
        email=str(payload.email).lower().strip(),
        company=(payload.company or "").strip() or None,
        project_type=payload.project_type,
        message=payload.message.strip(),
    )
    doc = msg.model_dump(by_alias=True)
    await db.contact_messages.insert_one(doc)
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
    writer.writerow(["id", "created_at", "name", "email", "company", "project_type", "read", "message"])
    async for d in cursor:
        writer.writerow([
            d.get("_id"),
            d.get("created_at").isoformat() if isinstance(d.get("created_at"), datetime) else d.get("created_at"),
            d.get("name", ""),
            d.get("email", ""),
            d.get("company", "") or "",
            d.get("project_type", "") or "",
            "yes" if d.get("read") else "no",
            (d.get("message", "") or "").replace("\n", " "),
        ])
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=arroyo_messages.csv"},
    )


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
