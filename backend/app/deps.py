"""Dépendances communes (auth)."""
from fastapi import Request, HTTPException, Depends
from app.services.auth_service import decode_token
from app.db import get_db
from bson import ObjectId

async def get_current_user_id(request: Request) -> str:
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Non authentifié")
    token = auth.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Token invalide")
    return payload["sub"]

async def get_current_user(request: Request) -> dict:
    """Retourne l'utilisateur complet (id + email) depuis le JWT."""
    user_id = await get_current_user_id(request)
    db = get_db()
    user = await db.client_users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return {"id": user_id, "email": user["email"], "name": user.get("name")}
