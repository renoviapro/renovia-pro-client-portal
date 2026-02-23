from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.deps import get_current_user
from app.connectors.compta_connector import get_maintenance_contract
from app.services.email_service import send_internal_notification

router = APIRouter(prefix="/api/v1", tags=["maintenance"])

PACK_LABELS = {
    "tranquille": "Tranquille",
    "tranquille_plus": "Tranquille+",
}


@router.get("/maintenance")
async def get_maintenance(user: dict = Depends(get_current_user)):
    contract = await get_maintenance_contract(user["email"])
    return {"contract": contract}


class SubscribeRequest(BaseModel):
    pack: str
    phone: str
    address: str
    notes: str = ""


@router.post("/maintenance/subscribe")
async def subscribe_maintenance(body: SubscribeRequest, user: dict = Depends(get_current_user)):
    """Envoie une demande de souscription à Renovia Pro par email."""
    pack_label = PACK_LABELS.get(body.pack, body.pack)
    subject = f"Demande contrat maintenance {pack_label} – {user['email']}"
    content = f"""
<h2>Nouvelle demande de contrat maintenance</h2>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
  <tr><td style="padding:6px 16px 6px 0;color:#666;">Pack demandé</td><td><strong>{pack_label}</strong></td></tr>
  <tr><td style="padding:6px 16px 6px 0;color:#666;">Client</td><td>{user.get('name') or user['email']}</td></tr>
  <tr><td style="padding:6px 16px 6px 0;color:#666;">Email</td><td>{user['email']}</td></tr>
  <tr><td style="padding:6px 16px 6px 0;color:#666;">Téléphone</td><td>{body.phone}</td></tr>
  <tr><td style="padding:6px 16px 6px 0;color:#666;">Adresse</td><td>{body.address}</td></tr>
  {"<tr><td style='padding:6px 16px 6px 0;color:#666;'>Message</td><td>" + body.notes + "</td></tr>" if body.notes else ""}
</table>
"""
    ok = send_internal_notification(subject, content)
    if not ok:
        raise HTTPException(status_code=500, detail="Erreur lors de l'envoi de la notification.")
    return {"ok": True}
