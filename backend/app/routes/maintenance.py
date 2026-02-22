from fastapi import APIRouter, Depends
from app.deps import get_current_user_id
from app.connectors.df_connector import get_maintenance_contract

router = APIRouter(prefix="/api/v1", tags=["maintenance"])

@router.get("/maintenance")
async def get_maintenance(user_id: str = Depends(get_current_user_id)):
    contract = await get_maintenance_contract(user_id)
    return {"contract": contract}
