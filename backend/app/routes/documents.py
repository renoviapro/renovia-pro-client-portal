from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from app.deps import get_current_user
from app.connectors.compta_connector import get_documents_for_client as compta_docs
from app.connectors.df_connector import (
    get_documents_for_client as df_docs,
    fetch_document_html,
    sign_document_in_df,
    get_payment_url,
)

router = APIRouter(prefix="/api/v1", tags=["documents"])


@router.get("/documents")
async def list_documents(user: dict = Depends(get_current_user)):
    email = user["email"]
    docs_compta = await compta_docs(email)
    docs_df = await df_docs(email)
    all_docs = docs_compta + docs_df
    all_docs.sort(key=lambda d: d.get("date", ""), reverse=True)
    return {"items": all_docs}


@router.get("/documents/{doc_id}/view", response_class=HTMLResponse)
async def view_document(doc_id: str, user: dict = Depends(get_current_user)):
    """Proxy sécurisé : récupère le HTML du document DF avec le JWT admin."""
    html = await fetch_document_html(doc_id)
    if not html:
        raise HTTPException(status_code=404, detail="Document introuvable ou inaccessible.")
    return HTMLResponse(content=html)


class SignRequest(BaseModel):
    signer_name: str


@router.post("/documents/{doc_id}/sign")
async def sign_document(doc_id: str, body: SignRequest, user: dict = Depends(get_current_user)):
    """Signe un devis dans DF au nom du client connecté."""
    name = body.signer_name or user.get("name") or user["email"]
    result = await sign_document_in_df(doc_id, name, user["email"])
    if result and result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return {"ok": True, "detail": result}


@router.get("/documents/{doc_id}/pay")
async def pay_document(doc_id: str, user: dict = Depends(get_current_user)):
    """Crée une session de paiement Mollie dans DF et retourne l'URL."""
    redirect = "https://client.renoviapro.fr/documents"
    url = await get_payment_url(doc_id, user["email"], redirect)
    if not url:
        raise HTTPException(status_code=400, detail="Impossible de créer le lien de paiement.")
    return {"checkout_url": url}
