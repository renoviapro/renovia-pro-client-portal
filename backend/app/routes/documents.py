from fastapi import APIRouter, Depends
from app.deps import get_current_user_id
from app.connectors.df_connector import get_documents_for_client

router = APIRouter(prefix="/api/v1", tags=["documents"])

@router.get("/documents")
async def list_documents(user_id: str = Depends(get_current_user_id)):
    items = await get_documents_for_client(user_id)
    return {"items": items}
