from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS, UPLOAD_DIR
from app.routes import auth, me, chantiers, documents, tickets, maintenance
from app.services.file_service import ensure_upload_dir
from pathlib import Path

app = FastAPI(title="Client Portal RenoviaPro", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

app.include_router(auth.router)
app.include_router(me.router)
app.include_router(chantiers.router)
app.include_router(documents.router)
app.include_router(tickets.router)
app.include_router(maintenance.router)

@app.get("/")
async def root():
    return {"service": "client-portal-api", "docs": "/docs"}
