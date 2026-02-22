"""
Connecteur renovia-pros-DF (https://df.renoviapro.fr).

Forge un JWT admin (sub = DF_ADMIN_USER_ID) pour appeler l'API DF,
puis cherche le client par email et récupère ses documents (devis/factures).
Si DF_JWT_SECRET est vide → retourne liste vide.
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from jose import jwt

from app.config import DF_URL, DF_JWT_SECRET, DF_ADMIN_USER_ID

log = logging.getLogger(__name__)


def _df_token() -> str:
    """JWT signé avec le secret DF, sub = UUID admin."""
    payload = {
        "sub": DF_ADMIN_USER_ID,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    return jwt.encode(payload, DF_JWT_SECRET, algorithm="HS256")


def _headers() -> dict:
    return {"Authorization": f"Bearer {_df_token()}"}


async def _get(path: str, params: dict | None = None) -> Any:
    if not DF_JWT_SECRET or not DF_ADMIN_USER_ID:
        return None
    url = f"{DF_URL.rstrip('/')}{path}"
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(url, headers=_headers(), params=params or {})
        if r.status_code == 200:
            return r.json()
        log.warning("[df] %s → %s : %s", url, r.status_code, r.text[:100])
        return None
    except Exception as exc:
        log.error("[df] erreur HTTP : %s", exc)
        return None


async def _get_df_client_id(email: str) -> str | None:
    """Trouve le client_id DF depuis l'email."""
    data = await _get("/api/clients", {"search": email})
    if not data:
        return None
    for c in (data if isinstance(data, list) else []):
        if c.get("email", "").lower() == email.lower():
            return c.get("id")
    return None


async def get_documents_for_client(email: str) -> list[dict[str, Any]]:
    """Retourne les devis et factures DF du client."""
    client_id = await _get_df_client_id(email)
    if not client_id:
        log.info("[df] client introuvable pour email=%s", email)
        return []

    data = await _get("/api/documents", {"client_id": client_id})
    if not data:
        return []

    result = []
    for d in (data if isinstance(data, list) else []):
        doc_id = d.get("id", "")
        doc_type = _doc_type(d.get("doc_type", ""))
        label = d.get("title") or d.get("doc_number") or "Document"
        if d.get("doc_number"):
            label = f"{d['doc_number']} – {d.get('title', '')}" if d.get("title") else d["doc_number"]
        result.append({
            "id": doc_id,
            "type": doc_type,
            "label": label.strip(" –"),
            "date": str(d.get("created_at", d.get("date", "")))[:10],
            "status": _doc_status(d.get("status", "")),
            "url": f"{DF_URL.rstrip('/')}/api/documents/{doc_id}/preview-html" if doc_id else "",
            "source": "df",
        })
    return result


def _doc_type(t: str) -> str:
    t = (t or "").lower()
    if "devis" in t or "quote" in t:
        return "devis"
    if "facture" in t or "invoice" in t:
        return "facture"
    if "avoir" in t or "credit" in t:
        return "avoir"
    return t or "document"


def _doc_status(s: str) -> str:
    mapping = {
        "draft": "Brouillon", "sent": "Envoyé", "accepted": "Accepté",
        "refused": "Refusé", "paid": "Payé", "cancelled": "Annulé",
        "pending": "En attente",
    }
    return mapping.get((s or "").lower(), s)
