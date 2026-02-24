"""Configuration client-portal."""
import os

DEBUG = os.getenv("DEBUG", "0") == "1"
BASE_URL_CLIENT = os.getenv("BASE_URL_CLIENT", "https://client.renoviapro.fr")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "https://client.renoviapro.fr").strip().split(",")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "client_portal")

# JWT
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Magic link
MAGIC_LINK_EXPIRE_MINUTES = int(os.getenv("MAGIC_LINK_EXPIRE_MINUTES", "15"))

# Rate limit
RATE_LIMIT_MAGIC_LINK_PER_HOUR = int(os.getenv("RATE_LIMIT_MAGIC_LINK_PER_HOUR", "5"))
RATE_LIMIT_VERIFY_PER_HOUR = int(os.getenv("RATE_LIMIT_VERIFY_PER_HOUR", "10"))
RATE_LIMIT_TICKET_CREATE_PER_HOUR = int(os.getenv("RATE_LIMIT_TICKET_CREATE_PER_HOUR", "5"))

# Upload (tickets)
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "5"))
MAX_TICKET_FILES = int(os.getenv("MAX_TICKET_FILES", "8"))

# ── Connexions inter-services ──────────────────────────────────────────────
# renovia-pro-compta (chantiers, documents client)
COMPTA_URL = os.getenv("COMPTA_URL", "https://app.renoviapro.fr")
COMPTA_JWT_SECRET = os.getenv("COMPTA_JWT_SECRET", "")
COMPTA_JWT_ALGORITHM = "HS256"

# renovia-pros-DF (devis, factures)
DF_URL = os.getenv("DF_URL", "https://df.renoviapro.fr")
DF_JWT_SECRET = os.getenv("DF_JWT_SECRET", "")
DF_ADMIN_USER_ID = os.getenv("DF_ADMIN_USER_ID", "")
DF_CLIENT_PORTAL_API_KEY = os.getenv("DF_CLIENT_PORTAL_API_KEY", "")
# ────────────────────────────────────────────────────────────────────────────

# SMTP (emails magic link) — même schéma que le site principal (backend)
SMTP_HOST = os.getenv("SMTP_HOST", "ssl0.ovh.net")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
# SMTP_PASS ou SMTP_PASSWORD pour partager le .env avec le site principal
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") or os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@renoviapro.fr")
