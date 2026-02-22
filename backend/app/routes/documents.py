from fastapi import APIRouter, Depends
from app.deps import get_current_user
from app.connectors.compta_connector import get_documents_for_client as compta_docs
from app.connectors.df_connector import get_documents_for_client as devis_docs

router = APIRouter(prefix="/api/v1", tags=["documents"])

@router.get("/documents")
async def list_documents(user: dict = Depends(get_current_user)):
    email = user["email"]
    # Fusionner docs compta + devis
    docs_compta = await compta_docs(email)
    docs_devis = await devis_docs(email)
    all_docs = docs_compta + docs_devis
    # Trier par date décroissante
    all_docs.sort(key=lambda d: d.get("date", ""), reverse=True)
    return {"items": all_docs}
