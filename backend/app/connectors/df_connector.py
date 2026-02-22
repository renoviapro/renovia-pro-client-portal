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


async def _post(path: str, body: dict | None = None) -> Any:
    if not DF_JWT_SECRET or not DF_ADMIN_USER_ID:
        return None
    url = f"{DF_URL.rstrip('/')}{path}"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(url, headers=_headers(), json=body or {})
        if r.status_code in (200, 201):
            return r.json()
        log.warning("[df] POST %s → %s : %s", url, r.status_code, r.text[:200])
        return {"error": r.text[:200], "status_code": r.status_code}
    except Exception as exc:
        log.error("[df] POST erreur : %s", exc)
        return {"error": str(exc)}


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


# Statuts visibles par le client (documents envoyés/finalisés uniquement)
_CLIENT_VISIBLE_STATUSES = {"sent", "accepted", "refused", "paid", "invoiced", "partially_paid"}


async def get_documents_for_client(email: str) -> list[dict[str, Any]]:
    """Retourne les devis et factures DF envoyés au client (pas les brouillons ni supprimés)."""
    client_id = await _get_df_client_id(email)
    if not client_id:
        log.info("[df] client introuvable pour email=%s", email)
        return []

    data = await _get("/api/documents", {"client_id": client_id})
    if not data:
        return []

    result = []
    for d in (data if isinstance(data, list) else []):
        # Exclure brouillons, annulés et documents archivés/supprimés
        status_raw = (d.get("status") or "").lower()
        if status_raw not in _CLIENT_VISIBLE_STATUSES:
            continue
        if d.get("archived_at") or d.get("deleted_at"):
            continue

        doc_id = d.get("id", "")
        raw_doc_type = (d.get("doc_type") or "").lower()
        doc_type = _doc_type(raw_doc_type)
        label = d.get("title") or d.get("doc_number") or "Document"
        if d.get("doc_number"):
            label = f"{d['doc_number']} – {d.get('title', '')}" if d.get("title") else d["doc_number"]

        # Actions disponibles selon le type et le statut
        actions: list[str] = []
        if doc_type == "devis" and status_raw == "sent":
            actions.append("sign")
        if doc_type == "facture" and status_raw in ("sent", "invoiced", "partially_paid"):
            actions.append("pay")

        result.append({
            "id": doc_id,
            "type": doc_type,
            "label": label.strip(" –"),
            "date": str(d.get("created_at", d.get("date", "")))[:10],
            "status": _doc_status(status_raw),
            "url": f"/api/v1/documents/{doc_id}/view",
            "source": "df",
            "actions": actions,
            "total_ttc": d.get("total_ttc"),
        })
    return result


async def sign_document_in_df(doc_id: str, signer_name: str, signer_email: str) -> dict:
    """Signe un devis dans DF au nom du client."""
    result = await _post(f"/api/documents/{doc_id}/sign", {
        "signer_name": signer_name,
        "signer_email": signer_email,
        "signed_at": datetime.now(timezone.utc).isoformat(),
    })
    return result or {"error": "Aucune réponse de DF"}


async def get_payment_url(doc_id: str, client_email: str, redirect_url: str) -> str | None:
    """Crée une session de paiement Mollie dans DF et retourne l'URL de redirection."""
    result = await _post(f"/api/documents/{doc_id}/payment", {
        "client_email": client_email,
        "redirect_url": redirect_url,
    })
    if result and not result.get("error"):
        return result.get("checkout_url") or result.get("payment_url") or result.get("url")
    # Fallback: essai avec l'endpoint checkout/create
    result2 = await _post("/api/checkout/create", {
        "doc_id": doc_id,
        "client_email": client_email,
        "redirect_url": redirect_url,
    })
    if result2 and not result2.get("error"):
        return result2.get("checkout_url") or result2.get("payment_url") or result2.get("url")
    log.warning("[df] payment url introuvable pour doc %s : %s", doc_id, result)
    return None


async def fetch_document_html(doc_id: str) -> str | None:
    """Récupère le HTML de prévisualisation d'un document DF (pour le proxy)."""
    if not DF_JWT_SECRET or not DF_ADMIN_USER_ID:
        return None
    url = f"{DF_URL.rstrip('/')}/api/documents/{doc_id}/preview-html"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(url, headers=_headers())
        if r.status_code == 200:
            return r.text
        log.warning("[df] preview %s → %s", doc_id, r.status_code)
        return None
    except Exception as exc:
        log.error("[df] preview erreur : %s", exc)
        return None


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
        "pending": "En attente", "invoiced": "Facturé", "partially_paid": "Partiel",
    }
    return mapping.get((s or "").lower(), s)
