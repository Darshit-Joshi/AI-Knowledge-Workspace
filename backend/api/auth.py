from fastapi import APIRouter, HTTPException, status, Request, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt

from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from datetime import datetime, timedelta, timezone
from core.database import get_db
from models.user import User
from schemas.auth import UserRegister, UserLogin, TokenResponse
from schemas.auth import ForgotPasswordRequest
from utils.token import generate_reset_token
from core.security import hash_password, verify_password, create_access_token
from schemas.auth import ResetPasswordRequest
from core.security import hash_password
from core.config import settings

router = APIRouter( prefix="/auth" , tags=["Authentication"])

oauth = OAuth()
oauth.register(
  name='google',
  client_id = settings.GOOGLE_CLIENT_ID,
  client_secret = settings.GOOGLE_CLIENT_SECRET,
  server_metadata_url = 'https://accounts.google.com/.well-known/openid-configuration',
  client_kwargs ={'scope':'openid email profile'}
)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/login"
)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        email = payload.get("sub")

        if email is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user
  
@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED
)
async def register_manual(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    hashed_pwd = hash_password(
        user.password
    )

    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_pwd,
        auth_provider="manual"
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    token = create_access_token(
        data={"sub": db_user.email}
    )

    return TokenResponse(
        access_token=token,
        user_email=db_user.email,
        auth_provider="manual"
    )

@router.post(
    "/login",
    response_model=TokenResponse
)
async def login_manual(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == credentials.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if user.provider != "manual":
        raise HTTPException(
            status_code=401,
            detail=(
                "This account uses Google login."
            )
        )

    if not verify_password(
        credentials.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(
        data={"sub": user.email}
    )

    return TokenResponse(
        access_token=token,
        user_email=user.email,
        auth_provider="manual"
    )
@router.get("/google/login")
async def google_login(request : Request):
  redirect_uri = settings.GOOGLE_REDIRECT_URI
  return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        token = await oauth.google.authorize_access_token(
            request
        )

        user_info = token.get("userinfo")

        if not user_info:
            raise HTTPException(
                status_code=400,
                detail="Failed to fetch Google user info"
            )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"OAuth authorization failed: {str(e)}"
        )

    email = user_info.get("email")

    name = user_info.get(
        "name",
        email.split("@")[0]
    )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # User exists but registered manually
    if user and user.provider == "manual":
        raise HTTPException(
            status_code=400,
            detail=(
                "This email is already registered "
                "with password login."
            )
        )

    # Create Google user if first login
    if not user:
        user = User(
            email=email,
            username=name,
            hashed_password=None,
            provider="google"
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(
        data={"sub": email}
    )

    return TokenResponse(
        access_token=access_token,
        user_email=email,
        auth_provider="google"
    )

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(
            User.email == request.email
        )
        .first()
    )

    if not user:
        return {
            "message":
            "If an account exists, a reset link has been sent."
        }

    token = generate_reset_token()

    expiry = (
        datetime.now(timezone.utc)
        + timedelta(hours=1)
    )

    user.reset_token = token
    user.reset_token_expiry = expiry

    db.commit()

    reset_link = (
        f"http://localhost:5173/"
        f"reset-password/{token}"
    )

    # TODO:
    # await send_reset_email(
    #     user.email,
    #     reset_link
    # )

    print(reset_link)

    return {
        "message":
        "Reset link sent successfully"
    }
    
    
@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(
            User.reset_token ==
            request.token
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid token"
        )

    if (
        user.reset_token_expiry is None
        or datetime.now(timezone.utc)
        > user.reset_token_expiry
    ):
        raise HTTPException(
            status_code=400,
            detail="Token expired"
        )

    user.hashed_password = (
        hash_password(
            request.new_password
        )
    )

    user.reset_token = None
    user.reset_token_expiry = None

    db.commit()

    return {
        "message":
        "Password reset successful"
    }
    
    
@router.get("/me")
async def get_me(
    current_user: User = Depends(
        get_current_user
    )
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "auth_provider": current_user.auth_provider,
    }