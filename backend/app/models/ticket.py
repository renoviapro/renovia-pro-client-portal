from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class TicketCreate(BaseModel):
    subject: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    chantier_id: Optional[str] = None

class TicketMessageCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=2000)

# Statuts SAV
STATUS_NEW = "NEW"
STATUS_IN_PROGRESS = "IN_PROGRESS"
STATUS_WAITING_CUSTOMER = "WAITING_CUSTOMER"
STATUS_CLOSED = "CLOSED"

# Résolution
RESOLUTION_COVERED = "COVERED"
RESOLUTION_NOT_COVERED = "NOT_COVERED"
