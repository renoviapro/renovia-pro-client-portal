from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    linked_client_id: Optional[str] = None
