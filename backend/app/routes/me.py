from fastapi import APIRouter, Depends
from app.db import get_db
from app.deps import get_current_user_id
from bson import ObjectId

router = APIRouter(prefix="/api/v1", tags=["me"])

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
        "linked_client_id": user.get("linked_client_id"),
    }
