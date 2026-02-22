"""Magic link + verify + JWT + refresh + login mot de passe + définir mot de passe."""
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, EmailStr, Field
from app.db import get_db
from app.config import (
    RATE_LIMIT_MAGIC_LINK_PER_HOUR,
    RATE_LIMIT_VERIFY_PER_HOUR,
)
from app.services.auth_service import (
    create_magic_token,
    create_access_token,
    create_refresh_token,
    decode_token,
    magic_link_url,
    magic_link_expires_at,
    hash_password,
    verify_password,
)
from app.services.rate_limit import is_allowed
from app.services.email_service import send_magic_link_email, send_reset_password_email, send_welcome_email

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

class MagicLinkRequest(BaseModel):
    email: EmailStr

class RefreshRequest(BaseModel):
    refresh_token: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SetPasswordRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=8)

@router.post("/magic-link")
async def post_magic_link(req: MagicLinkRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    key = f"magic:{ip}"
    if not is_allowed(key, 3600, RATE_LIMIT_MAGIC_LINK_PER_HOUR):
        raise HTTPException(status_code=429, detail="Trop de demandes. Réessayez plus tard.")
    email = req.email.strip().lower()
    db = get_db()
    user = await db.client_users.find_one({"email": email})
    is_new = not user
    if is_new:
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
    if is_new:
        send_welcome_email(email, link)
    else:
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
    is_new = not user or not user.get("name")
    access = create_access_token(user_id)
    refresh = create_refresh_token(user_id)
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer", "is_new_user": is_new}

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

@router.post("/login")
async def login_password(body: LoginRequest, request: Request):
    """Connexion par email + mot de passe."""
    ip = request.client.host if request.client else "unknown"
    if not is_allowed(f"login:{ip}", 3600, 10):
        raise HTTPException(status_code=429, detail="Trop de tentatives. Réessayez plus tard.")
    email = body.email.strip().lower()
    db = get_db()
    user = await db.client_users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")
    ph = user.get("password_hash")
    if not ph:
        raise HTTPException(status_code=400, detail="Ce compte n'a pas de mot de passe. Utilisez le lien magique ou créez un mot de passe.")
    if not verify_password(body.password, ph):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")
    user_id = str(user["_id"])
    access = create_access_token(user_id)
    refresh = create_refresh_token(user_id)
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}

@router.post("/set-password")
async def set_password(body: SetPasswordRequest, request: Request):
    """Créer ou réinitialiser le mot de passe du compte (email doit exister)."""
    ip = request.client.host if request.client else "unknown"
    if not is_allowed(f"setpwd:{ip}", 3600, 5):
        raise HTTPException(status_code=429, detail="Trop de demandes. Réessayez plus tard.")
    email = body.email.strip().lower()
    db = get_db()
    user = await db.client_users.find_one({"email": email})
    if not user:
        await db.client_users.insert_one({
            "email": email,
            "name": None,
            "linked_client_id": None,
            "password_hash": hash_password(body.password),
            "created_at": datetime.utcnow(),
        })
        user = await db.client_users.find_one({"email": email})
    else:
        await db.client_users.update_one(
            {"email": email},
            {"$set": {"password_hash": hash_password(body.password)}},
        )
    user_id = str(user["_id"])
    access = create_access_token(user_id)
    refresh = create_refresh_token(user_id)
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}

@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    if not is_allowed(f"forgot:{ip}", 3600, 5):
        raise HTTPException(status_code=429, detail="Trop de demandes. Réessayez plus tard.")
    email = body.email.strip().lower()
    db = get_db()
    user = await db.client_users.find_one({"email": email})
    if user:
        from app.config import BASE_URL_CLIENT
        token = create_magic_token()
        await db.magic_tokens.insert_one({
            "token": token, "email": email, "type": "reset",
            "expires_at": magic_link_expires_at(), "used_at": None, "ip": ip,
        })
        reset_link = f"{BASE_URL_CLIENT.rstrip('/')}/reset-password?token={token}"
        send_reset_password_email(email, reset_link)
    return {"ok": True, "message": "Si ce compte existe, un email a été envoyé."}

@router.post("/reset-password")
async def reset_password_route(body: ResetPasswordRequest, request: Request):
    db = get_db()
    row = await db.magic_tokens.find_one({"token": body.token, "type": "reset"})
    if not row or row.get("used_at"):
        raise HTTPException(status_code=400, detail="Lien invalide ou déjà utilisé.")
    if datetime.utcnow() > row["expires_at"]:
        raise HTTPException(status_code=400, detail="Lien expiré.")
    email = row["email"]
    await db.magic_tokens.update_one({"token": body.token}, {"$set": {"used_at": datetime.utcnow()}})
    await db.client_users.update_one(
        {"email": email}, {"$set": {"password_hash": hash_password(body.password)}}, upsert=True,
    )
    user = await db.client_users.find_one({"email": email})
    uid = str(user["_id"])
    return {"access_token": create_access_token(uid), "refresh_token": create_refresh_token(uid), "token_type": "bearer"}
