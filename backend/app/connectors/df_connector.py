"""
Connecteur renovia-devis-en-ligne.

Appelle /api/client/track ou /api/requests pour récupérer les devis du client.
DEVIS_URL = http://host.docker.internal:8010 (port 0.0.0.0 exposé sur le serveur).
Si DEVIS_URL est vide ou inaccessible → retourne liste vide.
"""
from __future__ import annotations
import logging
from typing import Any

import httpx

from app.config import DEVIS_URL

log = logging.getLogger(__name__)


async def _get(path: str, params: dict | None = None) -> Any:
    if not DEVIS_URL:
        return None
    url = f"{DEVIS_URL.rstrip('/')}{path}"
    try:
        async with httpx.AsyncClient(timeout=6) as client:
            r = await client.get(url, params=params or {})
        if r.status_code == 200:
            return r.json()
        log.warning("[devis] %s → %s", url, r.status_code)
        return None
    except Exception as exc:
        log.error("[devis] erreur HTTP : %s", exc)
        return None


async def get_devis_for_client_email(email: str) -> list[dict[str, Any]]:
    """Récupère les devis/demandes associés à cet email."""
    data = await _get("/api/requests", {"email": email})
    if not data:
        return []
    items = data if isinstance(data, list) else data.get("items", data.get("requests", []))
    result = []
    for d in items:
        if d.get("email", "").lower() != email.lower():
            continue
        result.append({
            "id": str(d.get("id") or d.get("_id", "")),
            "type": "devis",
            "label": d.get("title") or d.get("service") or d.get("type") or "Devis",
            "date": str(d.get("created_at", d.get("date", "")))[:10],
            "status": d.get("status", ""),
            "url": "",
        })
    return result


async def get_documents_for_client(email: str) -> list[dict[str, Any]]:
    """Documents = devis depuis renovia-devis-en-ligne."""
    return await get_devis_for_client_email(email)
