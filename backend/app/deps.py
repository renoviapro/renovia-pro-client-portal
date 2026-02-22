"""Dépendances communes (auth)."""
from fastapi import Request, HTTPException, Depends
from app.services.auth_service import decode_token

async def get_current_user_id(request: Request) -> str:
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Non authentifié")
    token = auth.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Token invalide")
    return payload["sub"]
