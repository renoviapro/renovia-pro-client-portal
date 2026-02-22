from fastapi import APIRouter, Depends
from app.deps import get_current_user
from app.connectors.compta_connector import get_chantiers_for_client, get_chantier_by_id

router = APIRouter(prefix="/api/v1", tags=["chantiers"])

@router.get("/chantiers")
async def list_chantiers(user: dict = Depends(get_current_user)):
    items = await get_chantiers_for_client(user["email"])
    return {"items": items}

@router.get("/chantiers/{chantier_id}")
async def get_chantier(chantier_id: str, user: dict = Depends(get_current_user)):
    c = await get_chantier_by_id(chantier_id, user["email"])
    if not c:
        return {"detail": "Chantier introuvable"}
    return c
