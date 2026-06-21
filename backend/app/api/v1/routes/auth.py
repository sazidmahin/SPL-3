from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models import User
from app.schemas.auth import AuthTokenResponse, CurrentUserResponse, LoginRequest, RegisterRequest
from app.services.auth_service import (
    DuplicateEmailError,
    InvalidCredentialsError,
    InvalidRegistrationError,
    authenticate_user,
    list_active_workspace_memberships,
    register_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    try:
        result = register_user(
            db,
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
        )
    except DuplicateEmailError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except InvalidRegistrationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    return AuthTokenResponse(access_token=result.access_token, user=result.user)


@router.post("/login", response_model=AuthTokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    try:
        result = authenticate_user(db, email=payload.email, password=payload.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    return AuthTokenResponse(access_token=result.access_token, user=result.user)


@router.get("/me", response_model=CurrentUserResponse)
def current_user(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> CurrentUserResponse:
    memberships = list_active_workspace_memberships(db, user_id=user.id)
    return CurrentUserResponse(user=user, workspaces=memberships)
