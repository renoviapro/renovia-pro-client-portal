from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db import get_db
from app.deps import get_current_user_id
from bson import ObjectId

router = APIRouter(prefix="/api/v1", tags=["me"])

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

@router.get("/me")
async def me(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    user = await db.client_users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name"),
        "phone": user.get("phone"),
        "linked_client_id": user.get("linked_client_id"),
    }

@router.patch("/me/profile")
async def update_profile(body: ProfileUpdate, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    update: dict = {}
    if body.name is not None:
        update["name"] = body.name.strip()
    if body.phone is not None:
        update["phone"] = body.phone.strip()
    if update:
        await db.client_users.update_one({"_id": ObjectId(user_id)}, {"$set": update})
    return {"ok": True}
