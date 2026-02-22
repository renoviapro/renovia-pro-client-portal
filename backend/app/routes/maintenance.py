from fastapi import APIRouter, Depends
from app.deps import get_current_user
from app.connectors.compta_connector import get_maintenance_contract

router = APIRouter(prefix="/api/v1", tags=["maintenance"])

@router.get("/maintenance")
async def get_maintenance(user: dict = Depends(get_current_user)):
    contract = await get_maintenance_contract(user["email"])
    return {"contract": contract}
