from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from app.deps import get_current_user
from app.connectors.df_connector import (
    get_maintenance_contract_for_client,
    get_contract_pdf_bytes,
    request_contract_cancellation,
    request_contract_upgrade,
)

router = APIRouter(prefix="/api/v1", tags=["maintenance"])


@router.get("/maintenance")
async def get_maintenance(user: dict = Depends(get_current_user)):
    contract = await get_maintenance_contract_for_client(user["email"])
    return {"contract": contract}


@router.get("/maintenance/contract-pdf")
async def download_contract_pdf(user: dict = Depends(get_current_user)):
    """Télécharge le PDF du contrat."""
    contract = await get_maintenance_contract_for_client(user["email"])
    if not contract:
        raise HTTPException(status_code=404, detail="Aucun contrat trouvé")
    
    pdf_bytes = await get_contract_pdf_bytes(contract["id"], user["email"])
    if not pdf_bytes:
        raise HTTPException(status_code=404, detail="PDF non disponible")
    
    filename = f"contrat-maintenance-{contract.get('contract_number', contract['id'][:8])}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


class CancelRequest(BaseModel):
    reason: Optional[str] = ""


@router.post("/maintenance/cancel")
async def cancel_contract(payload: CancelRequest, user: dict = Depends(get_current_user)):
    """Demande de résiliation du contrat."""
    contract = await get_maintenance_contract_for_client(user["email"])
    if not contract:
        raise HTTPException(status_code=404, detail="Aucun contrat trouvé")
    
    success = await request_contract_cancellation(contract["id"], user["email"], payload.reason or "")
    
    if not success:
        raise HTTPException(status_code=500, detail="Erreur lors de la demande de résiliation")
    
    return {"ok": True, "message": "Votre demande de résiliation a été enregistrée. Vous recevrez une confirmation par email."}


class UpgradeRequest(BaseModel):
    new_pack: str


@router.post("/maintenance/upgrade")
async def upgrade_contract(payload: UpgradeRequest, user: dict = Depends(get_current_user)):
    """Demande de changement d'abonnement."""
    if payload.new_pack not in ("tranquille", "tranquille_plus"):
        raise HTTPException(status_code=400, detail="Pack invalide")
    
    contract = await get_maintenance_contract_for_client(user["email"])
    if not contract:
        raise HTTPException(status_code=404, detail="Aucun contrat trouvé")
    
    if contract.get("pack") == payload.new_pack:
        raise HTTPException(status_code=400, detail="Vous avez déjà ce pack")
    
    success = await request_contract_upgrade(contract["id"], user["email"], payload.new_pack)
    
    if not success:
        raise HTTPException(status_code=500, detail="Erreur lors de la demande de changement")
    
    return {"ok": True, "message": "Votre demande de changement a été enregistrée. Vous recevrez une confirmation par email."}
