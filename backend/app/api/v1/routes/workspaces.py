from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_workspace_membership, get_db
from app.db.models import User, WorkspaceMember
from app.services.billing_service import BillingError
from app.schemas.workspace import (
    WorkspaceCreateRequest,
    WorkspaceMemberInviteRequest,
    WorkspaceMemberRead,
    WorkspaceMembershipRead,
)
from app.services.workspace_service import (
    DuplicateWorkspaceMemberError,
    DuplicateWorkspaceSlugError,
    InvalidWorkspaceError,
    UserNotFoundError,
    WorkspacePermissionError,
    create_organization_workspace,
    invite_workspace_member,
    list_user_workspace_memberships,
    list_workspace_members,
)

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("", response_model=list[WorkspaceMembershipRead])
def list_workspaces(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[WorkspaceMember]:
    return list_user_workspace_memberships(db, user_id=user.id)


@router.post(
    "",
    response_model=WorkspaceMembershipRead,
    status_code=status.HTTP_201_CREATED,
)
def create_workspace(
    payload: WorkspaceCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WorkspaceMember:
    try:
        return create_organization_workspace(
            db, owner=user, name=payload.name, slug=payload.slug
        )
    except DuplicateWorkspaceSlugError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except InvalidWorkspaceError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.get("/{workspace_id}", response_model=WorkspaceMembershipRead)
def get_workspace(
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
) -> WorkspaceMember:
    return membership


@router.get("/{workspace_id}/members", response_model=list[WorkspaceMemberRead])
def get_members(
    workspace_id: UUID,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> list[WorkspaceMember]:
    try:
        return list_workspace_members(
            db, workspace_id=workspace_id, requester_membership=membership
        )
    except WorkspacePermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.post(
    "/{workspace_id}/members/invite",
    response_model=WorkspaceMemberRead,
    status_code=status.HTTP_201_CREATED,
)
def invite_member(
    workspace_id: UUID,
    payload: WorkspaceMemberInviteRequest,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> WorkspaceMember:
    try:
        return invite_workspace_member(
            db,
            workspace_id=workspace_id,
            requester_membership=membership,
            email=payload.email,
            role=payload.role,
        )
    except WorkspacePermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except BillingError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except DuplicateWorkspaceMemberError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except InvalidWorkspaceError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
