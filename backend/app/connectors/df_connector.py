"""Connecteur documents / factures (mock). Interface pour future API DF."""
from typing import Any

async def get_documents_for_client(client_id: str) -> list[dict[str, Any]]:
    return [
        {"id": "doc-1", "type": "devis", "label": "Devis rénovation", "date": "2024-01-10", "url": "#"},
        {"id": "doc-2", "type": "facture", "label": "Facture acompte", "date": "2024-02-01", "url": "#"},
    ]

async def get_maintenance_contract(client_id: str) -> dict[str, Any] | None:
    # Mock : un contrat Tranquille+
    return {
        "plan": "Tranquille+",
        "start_date": "2024-06-01",
        "next_renewal": "2025-06-01",
        "included_depannage_min": 45,
        "factures": [
            {"id": "f1", "label": "Facture annuelle 2024", "date": "2024-06-01", "url": "#"},
        ],
    }
