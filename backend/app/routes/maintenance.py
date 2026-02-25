from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from app.deps import get_current_user
from app.connectors.df_connector import (
    get_all_contracts_for_client,
    get_maintenance_contract_for_client,
    get_contract_pdf_bytes,
    request_contract_cancellation,
    request_contract_upgrade,
    create_contract_for_client,
    get_invoice_pdf_bytes,
)

router = APIRouter(prefix="/api/v1", tags=["maintenance"])


@router.get("/maintenance")
async def get_maintenance(user: dict = Depends(get_current_user)):
    """Rétrocompatibilité: retourne le premier contrat actif."""
    contract = await get_maintenance_contract_for_client(user["email"])
    return {"contract": contract}


@router.get("/maintenance/contracts")
async def list_contracts(user: dict = Depends(get_current_user)):
    """Liste tous les contrats du client."""
    contracts = await get_all_contracts_for_client(user["email"])
    return {"contracts": contracts}


class CreateContractRequest(BaseModel):
    pack: str
    billing_cycle: str
    property_address: str
    property_postal_code: str
    property_city: str
    property_label: Optional[str] = ""


@router.post("/maintenance/contracts")
async def create_contract(payload: CreateContractRequest, user: dict = Depends(get_current_user)):
    """Crée un nouveau contrat pour un bien."""
    if payload.pack not in ("tranquille", "tranquille_plus"):
        raise HTTPException(status_code=400, detail="Pack invalide")
    if payload.billing_cycle not in ("monthly", "annual"):
        raise HTTPException(status_code=400, detail="Cycle de facturation invalide")
    if not payload.property_address or not payload.property_postal_code or not payload.property_city:
        raise HTTPException(status_code=400, detail="L'adresse du bien est obligatoire")

    result = await create_contract_for_client(
        email=user["email"],
        pack=payload.pack,
        billing_cycle=payload.billing_cycle,
        property_address=payload.property_address,
        property_postal_code=payload.property_postal_code,
        property_city=payload.property_city,
        property_label=payload.property_label or "",
    )

    if not result["ok"]:
        if "déjà" in result.get("error", "").lower() or "existe" in result.get("error", "").lower():
            raise HTTPException(status_code=409, detail=result["error"])
        elif "patienter" in result.get("error", "").lower():
            raise HTTPException(status_code=429, detail=result["error"])
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Erreur création"))

    return {"ok": True, "contract": result.get("contract")}


@router.get("/maintenance/contract-pdf/{contract_id}")
async def download_contract_pdf(contract_id: str, user: dict = Depends(get_current_user)):
    """Télécharge le PDF d'un contrat spécifique."""
    pdf_bytes = await get_contract_pdf_bytes(contract_id, user["email"])
    if not pdf_bytes:
        raise HTTPException(status_code=404, detail="PDF non disponible")

    filename = f"contrat-maintenance-{contract_id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/maintenance/contract-pdf")
async def download_first_contract_pdf(user: dict = Depends(get_current_user)):
    """Rétrocompatibilité: télécharge le PDF du premier contrat actif."""
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


@router.get("/maintenance/invoice-pdf/{invoice_id}")
async def download_invoice_pdf(invoice_id: str, user: dict = Depends(get_current_user)):
    """Télécharge le PDF d'une facture de maintenance."""
    pdf_bytes = await get_invoice_pdf_bytes(invoice_id, user["email"])
    if not pdf_bytes:
        raise HTTPException(status_code=404, detail="Facture non trouvée")

    filename = f"facture-maintenance-{invoice_id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


class CancelRequest(BaseModel):
    reason: Optional[str] = ""


@router.post("/maintenance/cancel/{contract_id}")
async def cancel_contract(contract_id: str, payload: CancelRequest, user: dict = Depends(get_current_user)):
    """Demande de résiliation d'un contrat spécifique."""
    success = await request_contract_cancellation(contract_id, user["email"], payload.reason or "")

    if not success:
        raise HTTPException(status_code=500, detail="Erreur lors de la demande de résiliation")

    return {"ok": True, "message": "Votre demande de résiliation a été enregistrée. Confirmation par email."}


@router.post("/maintenance/cancel")
async def cancel_first_contract(payload: CancelRequest, user: dict = Depends(get_current_user)):
    """Rétrocompatibilité: résilie le premier contrat actif."""
    contract = await get_maintenance_contract_for_client(user["email"])
    if not contract:
        raise HTTPException(status_code=404, detail="Aucun contrat trouvé")

    success = await request_contract_cancellation(contract["id"], user["email"], payload.reason or "")

    if not success:
        raise HTTPException(status_code=500, detail="Erreur lors de la demande de résiliation")

    return {"ok": True, "message": "Votre demande de résiliation a été enregistrée. Confirmation par email."}


class UpgradeRequest(BaseModel):
    new_pack: str


@router.post("/maintenance/upgrade/{contract_id}")
async def upgrade_contract(contract_id: str, payload: UpgradeRequest, user: dict = Depends(get_current_user)):
    """Demande de changement d'abonnement pour un contrat spécifique."""
    if payload.new_pack not in ("tranquille", "tranquille_plus"):
        raise HTTPException(status_code=400, detail="Pack invalide")

    success = await request_contract_upgrade(contract_id, user["email"], payload.new_pack)

    if not success:
        raise HTTPException(status_code=500, detail="Erreur lors de la demande de changement")

    return {"ok": True, "message": "Votre demande de changement a été enregistrée. Confirmation par email."}


@router.post("/maintenance/upgrade")
async def upgrade_first_contract(payload: UpgradeRequest, user: dict = Depends(get_current_user)):
    """Rétrocompatibilité: change le premier contrat actif."""
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

    return {"ok": True, "message": "Votre demande de changement a été enregistrée. Confirmation par email."}
