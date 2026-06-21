import re
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User, Workspace, WorkspaceMember

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_SLUG_RE = re.compile(r"[^a-z0-9]+")


class AuthError(Exception):
    """Base class for expected authentication failures."""


class DuplicateEmailError(AuthError):
    pass


class InvalidCredentialsError(AuthError):
    pass


class InvalidRegistrationError(AuthError):
    pass


@dataclass(frozen=True)
class AuthResult:
    access_token: str
    user: User


def _normalize_email(email: str) -> str:
    normalized = email.strip().lower()
    if not _EMAIL_RE.match(normalized):
        raise InvalidRegistrationError("Invalid email address")
    return normalized


def _workspace_slug(full_name: str, user_id: UUID) -> str:
    base = _SLUG_RE.sub("-", full_name.strip().lower()).strip("-") or "personal"
    return f"{base}-{str(user_id)[:8]}"


def register_user(db: Session, *, email: str, password: str, full_name: str) -> AuthResult:
    normalized_email = _normalize_email(email)
    existing_user = db.scalar(select(User).where(User.email == normalized_email))
    if existing_user is not None:
        raise DuplicateEmailError("Email is already registered")

    user = User(
        email=normalized_email,
        password_hash=hash_password(password),
        full_name=full_name.strip(),
        status="active",
    )
    db.add(user)
    db.flush()

    workspace = Workspace(
        name=f"{user.full_name}'s Workspace",
        slug=_workspace_slug(user.full_name, user.id),
        type="personal",
        owner_user_id=user.id,
        status="active",
    )
    db.add(workspace)
    db.flush()

    membership = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=user.id,
        role="owner",
        status="active",
    )
    db.add(membership)
    db.commit()
    db.refresh(user)

    return AuthResult(access_token=create_access_token(user.id), user=user)


def authenticate_user(db: Session, *, email: str, password: str) -> AuthResult:
    normalized_email = email.strip().lower()
    user = db.scalar(select(User).where(User.email == normalized_email, User.status == "active"))
    if user is None or not verify_password(password, user.password_hash):
        raise InvalidCredentialsError("Invalid email or password")

    return AuthResult(access_token=create_access_token(user.id), user=user)


def get_user_by_id(db: Session, user_id: UUID) -> User | None:
    return db.scalar(select(User).where(User.id == user_id, User.status == "active"))


def list_active_workspace_memberships(db: Session, *, user_id: UUID) -> list[WorkspaceMember]:
    return list(
        db.scalars(
            select(WorkspaceMember)
            .options(selectinload(WorkspaceMember.workspace))
            .join(Workspace)
            .where(
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.status == "active",
                Workspace.status == "active",
            )
            .order_by(Workspace.created_at.asc())
        )
    )
