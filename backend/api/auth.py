from fastapi import APIRouter, HTTPException, status, Request, Depends
from sqlalchemy.orm import Session
import jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from core.database import get_db
from models.user import User
from schemas.auth import UserRegister, UserLogin, TokenResponse
from core.security import hash_password, verify_password, create_access_token
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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> dict:
    """
    Global dependency to validate incoming app JWT tokens.
    Protects sensitive routes like document uploads and chat history.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
        
    return {"id": user.id, "email": user.email, "username": user.username}
  
  
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_manual( user: UserRegister , db: Session = Depends(get_db)) :
  existing_user = db.query(User).filter(User.email == user.email).first()
  
  if existing_user :
    raise HTTPException(status_code=400, detail="Email already exist")
  
  hashed_pwd = hash_password(user.password)
  
  db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_pwd,
        provider="manual"
    )
  db.add(db_user)
  db.commit()
  db.refresh(db_user)
     
  token = create_access_token( data ={"sub": user.email})
  return TokenResponse(access_token=token, user_email=user.email, auth_provider="manual")

@router.post("/login", response_model=TokenResponse)       
async def login_manual( credentials : UserLogin , db: Session = Depends(get_db)):
 user = db.query(User).filter(User.email == credentials.email).first()
 
 if not user or user.provider != "manual":
   raise HTTPException(
     status_code=status.HTTP_401_UNAUTHORIZED,
     detail='Invalid email or password. (If you registered via google, plaese use google login)'
   )
   
 if not verify_password(credentials.password, user.hashed_password):
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password"
    )
  
 token = create_access_token( data={"sub" : user.email})
  
 return TokenResponse(access_token=token, user_email=user.email, auth_provider="manual")

@router.get("/google/login")
async def google_login(request : Request):
  redirect_uri = settings.GOOGLE_REDIRECT_URI
  return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
  try:
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get('userinfo')
    if not user_info:
      raise HTTPException(status_code=400, detail="Failed to fetch user info from google")
    
  except Exception as e:
    raise HTTPException(status_code=400, detail =f"Oauth authorization failed: {str(e)}")
  
  email = user_info.get('email')
  name = user_info.get('name', email.split('@')[0])
  
  user = db.query(User).filter(User.email == email).first()
  
  if not user:
    user = User(
      email=email,
      username = name,
      hashed_password=None,
      provider="google"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
  access_token = create_access_token(data ={"sub":email})
  
  return TokenResponse(auth_provider="oauth", user_email=email, access_token=access_token)

@router.post("/token",response_model=TokenResponse)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Dedicated OAuth2 form-data route for Swagger UI and automated tools.
    Note: Swagger UI maps the 'username' field to whatever you type in the box (your email).
    """
    # Notice we use form_data.username to query the email column!
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or user.provider != "manual":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. (If you registered via Google, please use Google login)"
        )
        
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid password"
        )
      
    token = create_access_token(data={"sub": user.email})
      
    return TokenResponse(
        access_token=token, 
        user_email=user.email, 
        auth_provider="manual"
    )

