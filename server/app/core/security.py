# app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import bcrypt
import jwt
from app.core.config import settings

def hash_password(password: str) -> str:
    """Hashes a plain-text password using bcrypt with a generated salt."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str|None) -> bool:
    """Verifies a plain-text password against a stored bcrypt hash."""
    if not hash_password: return False
    try:
        plain_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        # Prevents system crashes if an invalid or corrupted hash string is checked
        return False

def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates a JSON Web Token (JWT) with an expiration timestamp."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        payload=to_encode, 
        key=settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt