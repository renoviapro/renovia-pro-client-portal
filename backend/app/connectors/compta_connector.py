"""Connecteur chantiers (mock). Interface pour future API Compta."""
from typing import Any

async def get_chantiers_for_client(client_id: str) -> list[dict[str, Any]]:
    # Mock : retourne des chantiers factices pour le client
    return [
        {
            "id": "chantier-1",
            "label": "Rénovation appartement Nice",
            "status": "TERMINÉ",
            "start_date": "2024-01-15",
            "end_date": "2024-03-20",
            "address": "12 rue Example, 06000 Nice",
        },
        {
            "id": "chantier-2",
            "label": "Salle de bain Villa",
            "status": "EN_COURS",
            "start_date": "2024-05-01",
            "end_date": None,
            "address": "5 av. Test, 06200 Nice",
        },
    ]

async def get_chantier_by_id(chantier_id: str, client_id: str) -> dict[str, Any] | None:
    chantiers = await get_chantiers_for_client(client_id)
    for c in chantiers:
        if c["id"] == chantier_id:
            c["photos_avant"] = []
            c["photos_apres"] = []
            return c
    return None
