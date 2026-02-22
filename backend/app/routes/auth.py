"""Magic link + verify + JWT + refresh + logout."""
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.db import get_db
from app.config import (
    RATE_LIMIT_MAGIC_LINK_PER_HOUR,
    RATE_LIMIT_VERIFY_PER_HOUR,
    CORS_ORIGINS,
)
from app.services.auth_service import (
    create_magic_token,
    create_access_token,
    create_refresh_token,
    decode_token,
    magic_link_url,
    magic_link_expires_at,
)
from app.services.rate_limit import is_allowed
from app.services.email_service import send_magic_link_email

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

class MagicLinkRequest(BaseModel):
    email: EmailStr

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/magic-link")
async def post_magic_link(req: MagicLinkRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    key = f"magic:{ip}"
    if not is_allowed(key, 3600, RATE_LIMIT_MAGIC_LINK_PER_HOUR):
        raise HTTPException(status_code=429, detail="Trop de demandes. Réessayez plus tard.")
    email = req.email.strip().lower()
    db = get_db()
    user = await db.client_users.find_one({"email": email})
    if not user:
        await db.client_users.insert_one({
            "email": email,
            "name": None,
            "linked_client_id": None,
            "created_at": datetime.utcnow(),
        })
    token = create_magic_token()
    await db.magic_tokens.insert_one({
        "token": token,
        "email": email,
        "expires_at": magic_link_expires_at(),
        "used_at": None,
        "ip": ip,
        "ua": request.headers.get("user-agent", ""),
    })
    link = magic_link_url(token)
    send_magic_link_email(email, link)
    return {"ok": True, "message": "Si ce compte existe, un lien a été envoyé par email."}

@router.post("/verify")
async def verify_token(request: Request):
    token = request.query_params.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token manquant")
    ip = request.client.host if request.client else "unknown"
    key = f"verify:{ip}"
    if not is_allowed(key, 3600, RATE_LIMIT_VERIFY_PER_HOUR):
        raise HTTPException(status_code=429, detail="Trop de demandes.")
    db = get_db()
    row = await db.magic_tokens.find_one({"token": token})
    if not row:
        raise HTTPException(status_code=400, detail="Lien invalide ou expiré.")
    if row.get("used_at"):
        raise HTTPException(status_code=400, detail="Lien déjà utilisé.")
    if datetime.utcnow() > row["expires_at"]:
        raise HTTPException(status_code=400, detail="Lien expiré.")
    email = row["email"]
    await db.magic_tokens.update_one({"token": token}, {"$set": {"used_at": datetime.utcnow()}})
    user = await db.client_users.find_one({"email": email})
    user_id = str(user["_id"]) if user else None
    if not user_id:
        user_doc = await db.client_users.find_one({"email": email})
        user_id = str(user_doc["_id"])
    access = create_access_token(user_id)
    refresh = create_refresh_token(user_id)
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}

@router.post("/refresh")
async def refresh_tokens(body: RefreshRequest):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token invalide.")
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Token invalide.")
    access = create_access_token(sub)
    refresh = create_refresh_token(sub)
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}
