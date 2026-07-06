from fastapi import APIRouter, HTTPException, status, Request, Depends
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
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

fake_users_db= {}

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_manual( user: UserRegister) :
  if user.email in fake_users_db :
    raise HTTPException(status_code=400 , detail="Email already Exist")
  hashed_pwd = hash_password(user.password)
  fake_users_db[user.email] ={
    "email":user.email,
    "password":hashed_pwd,
    "username": user.username,
    "provider":"manual"
  }
  
  token = create_access_token( data ={"sub": user.email})
  return TokenResponse(access_token=token, user_email=user.email, auth_provider="manual")

@router.post("/login", response_model=TokenResponse)
async def login_manual( credentials : UserLogin):
 user = fake_users_db.get(credentials.email)
 
 if not user or user.get("provider") != "manual":
   raise HTTPException(
     status_code=status.HTTP_401_UNAUTHORIZED,
     detail='Invalid email or password. (If you registered via google, plaese use google login)'
   )
   
 if not verify_password(credentials.password, user["password"]):
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password"
    )
  
 token = create_access_token( data={"sub" : user["email"]})
  
 return TokenResponse(access_token=token, user_email=user["email"], auth_provider="manual")

@router.get("/google/login")
async def google_login(request : Request):
  redirect_uri = settings.GOOGLE_REDIRECT_URI
  return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request: Request):
  try:
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get('userinfo')
    if not user_info:
      raise HTTPException(status_code=400, detail="Failed to fetch user info from google")
    
  except Exception as e:
    raise HTTPException(status_code=400, detail =f"Oauth authorization failed: {str(e)}")
  
  email = user_info.get('email')
  name = user_info.get('name', email.split('@')[0])
  
  if not email in fake_users_db:
    fake_users_db[email] = {
            "email": email,
            "username": name,
            "hashed_password": None, # No password needed for OAuth users!
            "provider": "google"
        }
  access_token = create_access_token(data ={"sub":email})
  
  return TokenResponse(auth_provider="oauth", user_email=email, access_token=access_token)

