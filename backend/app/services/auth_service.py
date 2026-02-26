"""Magic link + JWT + mot de passe."""
import secrets
import bcrypt
from datetime import datetime, timedelta
from jose import JWTError, jwt
from app.config import (
    JWT_SECRET,
    JWT_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    MAGIC_LINK_EXPIRE_MINUTES,
    BASE_URL_CLIENT,
)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_magic_token() -> str:
    return secrets.token_urlsafe(32)

def create_access_token(sub: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": sub, "exp": expire, "type": "access"},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )

def create_refresh_token(sub: str) -> str:
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": sub, "exp": expire, "type": "refresh"},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None

def magic_link_url(token: str) -> str:
    return f"{BASE_URL_CLIENT.rstrip('/')}/auth/callback?token={token}"

def magic_link_expires_at() -> datetime:
    return datetime.utcnow() + timedelta(minutes=MAGIC_LINK_EXPIRE_MINUTES)
