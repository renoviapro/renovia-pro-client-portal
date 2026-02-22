import uuid
from pathlib import Path
from fastapi import UploadFile
from app.config import UPLOAD_DIR, MAX_FILE_SIZE_MB, MAX_TICKET_FILES

MB = 1024 * 1024
ALLOWED = {"jpg", "jpeg", "png", "webp", "heic", "pdf"}

def ensure_upload_dir() -> Path:
    d = Path(UPLOAD_DIR)
    d.mkdir(parents=True, exist_ok=True)
    return d

def _ext(name: str) -> str:
    return name.rsplit(".", 1)[-1].lower() if "." in name else ""

def allowed_file(filename: str) -> bool:
    return _ext(filename) in ALLOWED

async def save_ticket_file(file: UploadFile, subdir: str = "tickets") -> str | None:
    if not file.filename or not allowed_file(file.filename):
        return None
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * MB:
        return None
    base = ensure_upload_dir()
    folder = base / subdir
    folder.mkdir(parents=True, exist_ok=True)
    ext = _ext(file.filename)
    fname = f"{uuid.uuid4().hex}.{ext}"
    path = folder / fname
    with open(path, "wb") as f:
        f.write(content)
    return f"{subdir}/{fname}"
