"""Tickets SAV: création (multipart + photos), liste, détail, messages."""
from datetime import datetime
from fastapi import APIRouter, Request, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from bson import ObjectId
from app.db import get_db
from app.deps import get_current_user_id
from app.models.ticket import (
    STATUS_NEW,
    STATUS_IN_PROGRESS,
    STATUS_WAITING_CUSTOMER,
    STATUS_CLOSED,
)
from app.services.file_service import save_ticket_file
from app.config import RATE_LIMIT_TICKET_CREATE_PER_HOUR, MAX_TICKET_FILES
from app.services.rate_limit import is_allowed

router = APIRouter(prefix="/api/v1", tags=["tickets"])

@router.get("/tickets")
async def list_tickets(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    cursor = db.tickets_sav.find({"client_id": user_id}).sort("created_at", -1)
    items = []
    async for doc in cursor:
        items.append({
            "id": str(doc["_id"]),
            "subject": doc.get("subject"),
            "status": doc.get("status", STATUS_NEW),
            "resolution": doc.get("resolution"),
            "created_at": doc["created_at"].isoformat() if doc.get("created_at") else None,
        })
    return {"items": items}

@router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    try:
        doc = await db.tickets_sav.find_one({"_id": ObjectId(ticket_id), "client_id": user_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    return {
        "id": str(doc["_id"]),
        "subject": doc.get("subject"),
        "description": doc.get("description"),
        "chantier_id": doc.get("chantier_id"),
        "status": doc.get("status"),
        "resolution": doc.get("resolution"),
        "created_at": doc["created_at"].isoformat() if doc.get("created_at") else None,
        "attachment_paths": doc.get("attachment_paths", []),
        "messages": doc.get("messages", []),
    }

@router.post("/tickets")
async def create_ticket(
    request: Request,
    subject: str = Form(...),
    description: str = Form(...),
    chantier_id: str = Form(""),
    photos: list[UploadFile] = File(default=[]),
    user_id: str = Depends(get_current_user_id),
):
    ip = request.client.host if request.client else "unknown"
    key = f"ticket:{user_id}"
    if not is_allowed(key, 3600, RATE_LIMIT_TICKET_CREATE_PER_HOUR):
        raise HTTPException(status_code=429, detail="Trop de créations de tickets.")
    files = list(photos) if photos else []
    files = [f for f in files if f and (f.filename or "").strip()]
    if len(files) > MAX_TICKET_FILES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_TICKET_FILES} fichiers.")
    paths = []
    for f in files:
        p = await save_ticket_file(f, "tickets")
        if p:
            paths.append(p)
    db = get_db()
    doc = {
        "client_id": user_id,
        "chantier_id": chantier_id or None,
        "subject": subject.strip()[:200],
        "description": description.strip()[:5000],
        "status": STATUS_NEW,
        "resolution": None,
        "attachment_paths": paths,
        "messages": [],
        "created_at": datetime.utcnow(),
    }
    r = await db.tickets_sav.insert_one(doc)
    return {"id": str(r.inserted_id), "message": "Ticket créé. Diagnostic SAV 49€ — offert si pris en charge, déduit si devis accepté. Réponse sous 24–48h ouvrées."}

class MessageBody(BaseModel):
    body: str

@router.post("/tickets/{ticket_id}/messages")
async def add_message(
    ticket_id: str,
    msg: MessageBody,
    user_id: str = Depends(get_current_user_id),
):
    body = msg.body
    db = get_db()
    try:
        doc = await db.tickets_sav.find_one({"_id": ObjectId(ticket_id), "client_id": user_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    msg = {"body": body[:2000], "from_client": True, "created_at": datetime.utcnow().isoformat()}
    await db.tickets_sav.update_one(
        {"_id": ObjectId(ticket_id), "client_id": user_id},
        {"$push": {"messages": msg}},
    )
    return {"ok": True}
