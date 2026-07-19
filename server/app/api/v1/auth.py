# app/api/v1/auth.py
from fastapi import APIRouter, HTTPException, status, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from authlib.integrations.starlette_client import OAuth
from fastapi.responses import RedirectResponse

from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token, TokenPayload
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Setup Authlib OAuth provider handler
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Global dependency to validate incoming JWT access tokens.
    Protects workspace isolation, multi-agent chat sessions, and document uploads.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    # Modern Async SQLAlchemy 2.0 query pattern
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
        
    return user

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_manual(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Registers a new user using local email and password credentials."""
    result = await db.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        if existing_user.provider == "google":
            detail_msg = "An account with this email already exists via Google Login. Please sign in using the 'Continue with Google' button."
        else:
            detail_msg = "An account with this email already exists. Please sign in instead."
            
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=detail_msg
        )
    
    hashed_pwd = hash_password(user_in.password)
    
    db_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=hashed_pwd,
        provider="manual"
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=Token)       
async def login_manual(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticates a user manually and returns a JWT access token."""
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    
    if not user or user.provider != "manual" or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. (If you signed up via Google, please use Google login.)"
        )
        
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid email or password."
        )
    
    token = create_access_token(data={"sub": user.email})
    return Token(access_token=token, token_type="bearer")

@router.get("/google/login")
async def google_login(request: Request):
    """Triggers the secure OAuth redirect handshake to Google authorization servers."""
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback", response_model=Token)
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    """Handles secure callback tokens returned from Google authentication."""
    try:
        token_payload = await oauth.google.authorize_access_token(request)
        user_info = token_payload.get('userinfo')
        if not user_info:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to parse user payload from Google.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"OAuth validation failed: {str(e)}")
    
    email = user_info.get('email')
    name = user_info.get('name', email.split('@')[0])
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(
            email=email,
            username=name,
            hashed_password=None,
            provider="google"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
    access_token = create_access_token(data={"sub": email})
    
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    return RedirectResponse(f"{frontend_url}/?token={access_token}")


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    """Dedicated Swagger UI OAuth2 standard credentials authorization route."""
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or user.provider != "manual":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid email or password."
        )
      
    token = create_access_token(data={"sub": user.email})
    return Token(access_token=token, token_type="bearer")

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Fetches the active user profile based on validated JWT token verification."""
    return current_user