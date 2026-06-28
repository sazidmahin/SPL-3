from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import User, Workspace, WorkspaceMember
from app.services.billing_service import require_member_capacity

WORKSPACE_ROLES = {"owner", "admin", "member", "viewer"}
INVITABLE_ROLES = {"admin", "member", "viewer"}
MANAGER_ROLES = {"owner", "admin"}


class WorkspaceError(Exception):
    """Base class for expected workspace failures."""


class DuplicateWorkspaceSlugError(WorkspaceError):
    pass


class DuplicateWorkspaceMemberError(WorkspaceError):
    pass


class InvalidWorkspaceError(WorkspaceError):
    pass


class WorkspaceNotFoundError(WorkspaceError):
    pass


class WorkspacePermissionError(WorkspaceError):
    pass


class UserNotFoundError(WorkspaceError):
    pass


def list_user_workspace_memberships(
    db: Session, *, user_id: UUID
) -> list[WorkspaceMember]:
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
            .order_by(Workspace.type.asc(), Workspace.created_at.asc())
        )
    )


def create_organization_workspace(
    db: Session, *, owner: User, name: str, slug: str
) -> WorkspaceMember:
    normalized_name = name.strip()
    normalized_slug = slug.strip().lower()
    if not normalized_name:
        raise InvalidWorkspaceError("Workspace name is required")

    existing = db.scalar(select(Workspace).where(Workspace.slug == normalized_slug))
    if existing is not None:
        raise DuplicateWorkspaceSlugError("Workspace slug is already in use")

    workspace = Workspace(
        name=normalized_name,
        slug=normalized_slug,
        type="organization",
        owner_user_id=owner.id,
        status="active",
    )
    db.add(workspace)
    db.flush()

    membership = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=owner.id,
        role="owner",
        status="active",
    )
    db.add(membership)
    db.commit()

    return get_active_workspace_membership(db, user_id=owner.id, workspace_id=workspace.id)


def get_active_workspace_membership(
    db: Session, *, user_id: UUID, workspace_id: UUID
) -> WorkspaceMember:
    membership = db.scalar(
        select(WorkspaceMember)
        .options(selectinload(WorkspaceMember.workspace))
        .join(Workspace)
        .where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
            WorkspaceMember.status == "active",
            Workspace.status == "active",
        )
    )
    if membership is None:
        raise WorkspaceNotFoundError("Workspace not found")
    return membership


def require_workspace_role(
    membership: WorkspaceMember, *, allowed_roles: set[str]
) -> None:
    if membership.role not in allowed_roles:
        raise WorkspacePermissionError("Insufficient workspace permissions")


def list_workspace_members(
    db: Session, *, workspace_id: UUID, requester_membership: WorkspaceMember
) -> list[WorkspaceMember]:
    require_workspace_role(requester_membership, allowed_roles=MANAGER_ROLES)
    return list(
        db.scalars(
            select(WorkspaceMember)
            .where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.status == "active",
            )
            .order_by(WorkspaceMember.created_at.asc())
        )
    )


def invite_workspace_member(
    db: Session,
    *,
    workspace_id: UUID,
    requester_membership: WorkspaceMember,
    email: str,
    role: str,
) -> WorkspaceMember:
    require_workspace_role(requester_membership, allowed_roles=MANAGER_ROLES)
    workspace = requester_membership.workspace
    if workspace.type != "organization":
        raise InvalidWorkspaceError("Members can only be invited to organization workspaces")
    if role not in INVITABLE_ROLES:
        raise InvalidWorkspaceError("Invalid workspace role")

    user = db.scalar(
        select(User).where(User.email == email.strip().lower(), User.status == "active")
    )
    if user is None:
        raise UserNotFoundError("User not found")

    active_member_count = db.scalar(
        select(func.count())
        .select_from(WorkspaceMember)
        .where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.status == "active",
        )
    )
    if workspace.type == "personal" and active_member_count >= 1:
        raise InvalidWorkspaceError("Personal workspaces cannot have additional members")

    existing_membership = db.scalar(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user.id,
            WorkspaceMember.status == "active",
        )
    )
    if existing_membership is not None:
        raise DuplicateWorkspaceMemberError("User is already a workspace member")

    require_member_capacity(db, workspace_id=workspace_id)

    membership = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=user.id,
        role=role,
        status="active",
        invited_by=requester_membership.user_id,
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership
