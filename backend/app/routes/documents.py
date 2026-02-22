from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from app.deps import get_current_user
from app.connectors.compta_connector import get_documents_for_client as compta_docs
from app.connectors.df_connector import get_documents_for_client as df_docs, fetch_document_html

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
    """Proxy sécurisé : récupère le HTML du document DF avec le JWT admin et le retourne au client."""
    html = await fetch_document_html(doc_id)
    if not html:
        raise HTTPException(status_code=404, detail="Document introuvable ou inaccessible.")
    return HTMLResponse(content=html)
