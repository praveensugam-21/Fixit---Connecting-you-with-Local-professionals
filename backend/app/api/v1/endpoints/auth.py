import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import TokenType, create_access_token, create_refresh_token
from app.crud import user as user_crud
from app.models.user import UserRole
from app.schemas.auth import GoogleAuthRequest, LoginRequest
from app.schemas.token import RefreshRequest, Token
from app.schemas.user import UserCreate, UserRead
from app.services.auth_service import verify_google_id_token

router = APIRouter(prefix="/auth", tags=["auth"])


def _issue_tokens(user_id: str, role: str) -> Token:
    return Token(
        access_token=create_access_token(user_id, role),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(data: UserCreate, db: Session = Depends(get_db)) -> Token:
    if user_crud.get_by_email(db, data.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = user_crud.create(db, data)
    return _issue_tokens(str(user.id), user.role.value)


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> Token:
    user = user_crud.authenticate(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    return _issue_tokens(str(user.id), user.role.value)


@router.post("/google", response_model=Token)
def google_login(data: GoogleAuthRequest, db: Session = Depends(get_db)) -> Token:
    try:
        profile = verify_google_id_token(data.id_token)
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token") from exc

    if not profile.email_verified:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google email not verified")

    user = user_crud.get_by_google_sub(db, profile.sub)
    if user is None:
        user = user_crud.get_by_email(db, profile.email)
        if user is None:
            user = user_crud.create_from_google(
                db,
                email=profile.email,
                full_name=profile.full_name,
                google_sub=profile.sub,
                role=UserRole.CUSTOMER,
            )

    return _issue_tokens(str(user.id), user.role.value)


@router.post("/refresh", response_model=Token)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)) -> Token:
    try:
        payload = jwt.decode(data.refresh_token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

    if payload.get("type") != TokenType.REFRESH.value:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    try:
        user_id = uuid.UUID(payload["sub"])
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

    user = user_crud.get_by_id(db, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return _issue_tokens(str(user.id), user.role.value)
