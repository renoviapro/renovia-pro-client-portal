"""
Connecteur renovia-pro-compta.

Forge un JWT avec le secret partagé (même algorithme que compta) et appelle
/api/client/dashboard, /api/client/documents et /api/sites.
Si COMPTA_JWT_SECRET est vide → retourne des données vides (mock désactivé).
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from jose import jwt

from app.config import COMPTA_URL, COMPTA_JWT_SECRET, COMPTA_JWT_ALGORITHM

log = logging.getLogger(__name__)


def _compta_token(email: str) -> str:
    """Forge un JWT compta-compatible (sub=email, exp=1h)."""
    payload = {
        "sub": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    return jwt.encode(payload, COMPTA_JWT_SECRET, algorithm=COMPTA_JWT_ALGORITHM)


def _headers(email: str) -> dict:
    return {"Authorization": f"Bearer {_compta_token(email)}"}


async def _get(path: str, email: str, params: dict | None = None) -> Any:
    """GET vers compta. Retourne None en cas d'erreur."""
    if not COMPTA_JWT_SECRET:
        return None
    url = f"{COMPTA_URL.rstrip('/')}{path}"
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(url, headers=_headers(email), params=params or {})
        if r.status_code == 200:
            return r.json()
        log.warning("[compta] %s → %s", url, r.status_code)
        return None
    except Exception as exc:
        log.error("[compta] erreur HTTP : %s", exc)
        return None


# ── Chantiers (sites) ────────────────────────────────────────────────────────

async def get_chantiers_for_client(email: str) -> list[dict[str, Any]]:
    data = await _get("/api/sites", email)
    if not data:
        return []
    sites = data if isinstance(data, list) else data.get("items", data.get("sites", []))
    result = []
    for s in sites:
        result.append({
            "id": str(s.get("id") or s.get("_id", "")),
            "label": s.get("name") or s.get("label", "Chantier"),
            "status": _normalize_status(s.get("status", "")),
            "address": s.get("address") or s.get("location", ""),
        })
    return result


async def get_chantier_by_id(chantier_id: str, email: str) -> dict[str, Any] | None:
    data = await _get(f"/api/sites/{chantier_id}", email)
    if not data:
        return None
    entries = await _get(f"/api/sites/{chantier_id}/entries", email) or []
    photos_avant = []
    photos_apres = []
    for e in (entries if isinstance(entries, list) else entries.get("items", [])):
        for ph in e.get("photos", []):
            url = ph.get("url") or ph.get("path", "")
            if ph.get("type") == "avant":
                photos_avant.append(url)
            else:
                photos_apres.append(url)
    return {
        "id": str(data.get("id") or data.get("_id", chantier_id)),
        "label": data.get("name") or data.get("label", ""),
        "status": _normalize_status(data.get("status", "")),
        "address": data.get("address") or data.get("location", ""),
        "photos_avant": photos_avant,
        "photos_apres": photos_apres,
    }


async def get_maintenance_contract(email: str) -> dict[str, Any] | None:
    """Pas de route maintenance dans compta → None."""
    return None


# ── Documents ────────────────────────────────────────────────────────────────

async def get_documents_for_client(email: str) -> list[dict[str, Any]]:
    data = await _get("/api/client/documents", email)
    if not data:
        return []
    docs = data if isinstance(data, list) else data.get("items", data.get("documents", []))
    result = []
    for d in docs:
        result.append({
            "id": str(d.get("id") or d.get("_id", "")),
            "type": _doc_type(d.get("type") or d.get("category", "")),
            "label": d.get("title") or d.get("label") or d.get("name", "Document"),
            "date": _fmt_date(d.get("date") or d.get("created_at", "")),
            "url": d.get("url") or d.get("download_url", ""),
        })
    return result


# ── Helpers ──────────────────────────────────────────────────────────────────

def _normalize_status(s: str) -> str:
    s = (s or "").upper().strip()
    mapping = {
        "TERMINE": "Terminé", "TERMINÉ": "Terminé", "DONE": "Terminé", "COMPLETED": "Terminé",
        "EN_COURS": "En cours", "EN COURS": "En cours", "IN_PROGRESS": "En cours",
        "PLANIFIE": "Planifié", "PLANIFIÉ": "Planifié", "PLANNED": "Planifié",
        "SUSPENDU": "Suspendu", "SUSPENDED": "Suspendu",
    }
    return mapping.get(s, s.capitalize() if s else "—")


def _doc_type(t: str) -> str:
    t = (t or "").lower()
    if "devis" in t or "estimate" in t or "quote" in t:
        return "devis"
    if "fact" in t or "invoice" in t:
        return "facture"
    if "attest" in t or "certif" in t:
        return "attestation"
    return t or "document"


def _fmt_date(d: str) -> str:
    if not d:
        return ""
    try:
        return d[:10]
    except Exception:
        return str(d)
