from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URI, MONGO_DB

client: AsyncIOMotorClient | None = None

def get_client() -> AsyncIOMotorClient:
    global client
    if client is None:
        client = AsyncIOMotorClient(MONGO_URI)
    return client

def get_db():
    return get_client()[MONGO_DB]
