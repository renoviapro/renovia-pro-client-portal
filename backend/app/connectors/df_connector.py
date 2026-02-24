"""
Connecteur renovia-pros-DF (https://df.renoviapro.fr).

- Authentification : JWT admin (sub = DF_ADMIN_USER_ID, secret = DF_JWT_SECRET)
- Documents : les tokens public_signing_token / public_payment_token sont fournis
  directement par GET /api/documents. Si absents, on les génère via API.
- Signature  : page publique DF → /sign/{public_signing_token}
- Paiement   : page publique DF → /pay/{public_payment_token}
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from jose import jwt

from app.config import DF_URL, DF_JWT_SECRET, DF_ADMIN_USER_ID, DF_CLIENT_PORTAL_API_KEY

log = logging.getLogger(__name__)

# Statuts DF (uppercase dans la BDD DF)
_CLIENT_VISIBLE_STATUSES = {"SENT", "ACCEPTED", "REFUSED", "INVOICED", "COMPLETED",
                             "PAID", "TRANSFER_PENDING", "PARTIALLY_PAID"}


def _df_token() -> str:
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
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, headers=_headers(), params=params or {})
        if r.status_code == 200:
            return r.json()
        log.warning("[df] GET %s → %s : %s", url, r.status_code, r.text[:100])
        return None
    except Exception as exc:
        log.error("[df] GET erreur : %s", exc)
        return None


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
        return None
    except Exception as exc:
        log.error("[df] POST erreur : %s", exc)
        return None


async def _get_df_client_id(email: str) -> str | None:
    data = await _get("/api/clients", {"search": email})
    if not data:
        return None
    for c in (data if isinstance(data, list) else []):
        if c.get("email", "").lower() == email.lower():
            return c.get("id")
    return None


async def _ensure_signing_token(doc_id: str, existing_token: str | None) -> str | None:
    """Retourne le token de signature existant ou en génère un via l'API DF admin."""
    if existing_token:
        return existing_token
    result = await _post(f"/api/documents/{doc_id}/signing-link")
    if result:
        return result.get("token")
    return None


async def _ensure_payment_token(doc_id: str, existing_token: str | None) -> str | None:
    """Retourne le token de paiement existant ou en génère un via l'API DF admin."""
    if existing_token:
        return existing_token
    result = await _post(f"/api/payments/{doc_id}/create-payment-link")
    if result:
        return result.get("public_token")
    return None


async def get_documents_for_client(email: str) -> list[dict[str, Any]]:
    """Retourne les devis et factures DF envoyés au client (pas les brouillons)."""
    client_id = await _get_df_client_id(email)
    if not client_id:
        log.info("[df] client introuvable pour email=%s", email)
        return []

    data = await _get("/api/documents", {"client_id": client_id})
    if not data:
        return []

    result = []
    for d in (data if isinstance(data, list) else []):
        status_raw = (d.get("status") or "").upper()
        if status_raw not in _CLIENT_VISIBLE_STATUSES:
            continue
        if d.get("archived_at") or d.get("deleted_at"):
            continue

        doc_id = d.get("id", "")
        raw_doc_type = (d.get("doc_type") or "").upper()
        doc_type = _doc_type(raw_doc_type)
        label = d.get("doc_number") or d.get("title") or "Document"
        if d.get("doc_number") and d.get("title"):
            label = f"{d['doc_number']} – {d['title']}"

        # URLs de signature et paiement (pages publiques DF)
        sign_url: str | None = None
        pay_url: str | None = None
        actions: list[str] = []

        if doc_type == "devis" and status_raw == "SENT":
            token = await _ensure_signing_token(doc_id, d.get("public_signing_token"))
            if token:
                sign_url = f"{DF_URL.rstrip('/')}/sign/{token}"
                actions.append("sign")

        if doc_type == "facture" and status_raw in ("SENT", "TRANSFER_PENDING", "PARTIALLY_PAID"):
            token = await _ensure_payment_token(doc_id, d.get("public_payment_token"))
            if token:
                pay_url = f"{DF_URL.rstrip('/')}/pay/{token}"
                actions.append("pay")

        result.append({
            "id": doc_id,
            "type": doc_type,
            "label": label,
            "date": str(d.get("issue_date") or d.get("created_at", ""))[:10],
            "status": _doc_status(status_raw),
            "url": f"/api/v1/documents/{doc_id}/view",
            "sign_url": sign_url,
            "pay_url": pay_url,
            "actions": actions,
            "total_ttc": d.get("total_ttc"),
            "source": "df",
        })
    return result


async def fetch_document_html(doc_id: str) -> str | None:
    """Récupère le HTML de prévisualisation via le token admin (proxy sécurisé)."""
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
    t = (t or "").upper()
    if t == "QUOTE":
        return "devis"
    if t == "INVOICE":
        return "facture"
    return t.lower() or "document"


async def get_maintenance_contract_for_client(email: str) -> dict[str, Any] | None:
    """Récupère le contrat de maintenance actif et les factures du client depuis DF via l'API client-portal."""
    if not DF_CLIENT_PORTAL_API_KEY:
        log.warning("[df] DF_CLIENT_PORTAL_API_KEY non configurée, fallback sur API admin")
        return await _get_maintenance_contract_fallback(email)
    
    url = f"{DF_URL.rstrip('/')}/api/client-portal/contract"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                url,
                params={"email": email},
                headers={"X-API-Key": DF_CLIENT_PORTAL_API_KEY}
            )
        if r.status_code != 200:
            log.warning("[df] client-portal/contract → %s : %s", r.status_code, r.text[:100])
            return None
        data = r.json()
    except Exception as exc:
        log.error("[df] client-portal/contract erreur : %s", exc)
        return None

    contract = data.get("contract")
    if not contract:
        return None

    invoices_raw = data.get("invoices") or []
    return {
        "id": contract.get("id", ""),
        "contract_number": contract.get("contract_number", ""),
        "pack": contract.get("pack", ""),
        "pack_label": contract.get("plan", contract.get("pack_label", "")),
        "billing_cycle": contract.get("billing_cycle", "monthly"),
        "price": contract.get("price", 0),
        "status": "ACTIVE",
        "next_billing_date": contract.get("next_renewal", ""),
        "start_date": contract.get("start_date", ""),
        "invoices": [
            {
                "id": inv.get("id"),
                "amount": inv.get("amount"),
                "status": "PAID" if inv.get("status") == "PAID" else "UNPAID",
                "due_date": inv.get("due_date", ""),
                "paid_at": inv.get("created_at", "") if inv.get("status") == "PAID" else "",
                "pay_url": inv.get("payment_url"),
            }
            for inv in invoices_raw
        ],
    }


async def _get_maintenance_contract_fallback(email: str) -> dict[str, Any] | None:
    """Fallback: récupère via l'API admin (sans factures)."""
    data = await _get("/api/contracts", params={"status": "ACTIVE"})
    if not data:
        data = await _get("/api/contracts")
    if not data:
        return None
    contracts = data if isinstance(data, list) else data.get("contracts", [])
    for c in contracts:
        if (c.get("client_email") or "").lower() == email.lower():
            return {
                "id": c.get("id"),
                "contract_number": c.get("contract_number"),
                "pack": c.get("pack"),
                "pack_label": c.get("pack_label"),
                "billing_cycle": c.get("billing_cycle"),
                "price": c.get("price"),
                "status": c.get("status"),
                "next_billing_date": (c.get("next_billing_date") or "")[:10],
                "start_date": (c.get("start_date") or "")[:10],
                "invoices": [],
            }
    return None


def _doc_status(s: str) -> str:
    mapping = {
        "DRAFT": "Brouillon",
        "SENT": "Envoyé",
        "ACCEPTED": "Accepté",
        "REFUSED": "Refusé",
        "EXPIRED": "Expiré",
        "INVOICED": "Facturé",
        "COMPLETED": "Soldé",
        "PAID": "Payé",
        "CANCELED": "Annulé",
        "TRANSFER_PENDING": "Virement en attente",
        "PARTIALLY_PAID": "Partiel",
    }
    return mapping.get((s or "").upper(), s)


async def get_contract_pdf_bytes(contract_id: str, email: str) -> bytes | None:
    """Télécharge le PDF d'un contrat depuis DF."""
    if not DF_JWT_SECRET or not DF_ADMIN_USER_ID:
        return None
    url = f"{DF_URL.rstrip('/')}/api/contracts/{contract_id}/pdf"
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(url, headers=_headers(), params={"email": email})
        if r.status_code == 200:
            return r.content
        log.warning("[df] contract pdf %s → %s", contract_id, r.status_code)
        return None
    except Exception as exc:
        log.error("[df] contract pdf erreur : %s", exc)
        return None


async def get_invoice_pdf_bytes(invoice_id: str, email: str) -> bytes | None:
    """Télécharge le PDF d'une facture de maintenance depuis DF via l'API client-portal."""
    if not DF_CLIENT_PORTAL_API_KEY:
        return None
    url = f"{DF_URL.rstrip('/')}/api/client-portal/invoice-pdf/{invoice_id}"
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(
                url,
                params={"email": email},
                headers={"X-API-Key": DF_CLIENT_PORTAL_API_KEY}
            )
        if r.status_code == 200:
            return r.content
        log.warning("[df] invoice pdf %s → %s", invoice_id, r.status_code)
        return None
    except Exception as exc:
        log.error("[df] invoice pdf erreur : %s", exc)
        return None


async def request_contract_cancellation(contract_id: str, email: str, reason: str) -> bool:
    """Demande de résiliation via l'API client-portal de DF."""
    result = await _post(f"/api/client-portal/contracts/{contract_id}/cancel", {"email": email, "reason": reason})
    return result is not None and result.get("ok", False)


async def request_contract_upgrade(contract_id: str, email: str, new_pack: str) -> bool:
    """Demande de changement d'abonnement via l'API client-portal de DF."""
    result = await _post(f"/api/client-portal/contracts/{contract_id}/upgrade", {"email": email, "new_pack": new_pack})
    return result is not None and result.get("ok", False)
