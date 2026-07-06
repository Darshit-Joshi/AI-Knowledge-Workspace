from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
import jwt

SECRET_KEY = "your-super-secret-jwt-key-never-hardcode-in-prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def hash_password(password:str) -> str:
  """Hashes a plain-text password"""
  pwd_bytes = password.encode('utf-8')
  salt = bcrypt.gensalt()
  hashed_password = bcrypt.hashpw(pwd_bytes, salt)
  
  return hashed_password.decode('utf-8')

def verify_password( plain_password : str, hashed_password: str) -> bool:
  try:
        # Convert both strings back to bytes to safely compare them
        plain_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
  except Exception:
        return False

def create_access_token(data : dict, expires_delta: Optional[timedelta] = None) -> str:
  to_encode = data.copy()
  if expires_delta :
    expire =  datetime.now(timezone.utc) + expires_delta
  else :
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
  to_encode.update({"exp":expire})
  
  encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
  return encoded_jwt
