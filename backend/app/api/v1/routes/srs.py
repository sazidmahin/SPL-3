from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_workspace_membership, get_db
from app.db.models import GenerationJob, RequirementInput, WorkspaceMember
from app.schemas.srs import (
    GenerationJobRead,
    RequirementInputCreateRequest,
    RequirementInputRead,
    SrsGenerateRequest,
    SrsGenerateResponse,
)
from app.services.billing_service import BillingError
from app.services.srs_service import (
    GenerationJobNotFoundError,
    InvalidSrsRequestError,
    create_requirement_input,
    get_generation_job,
    list_generation_jobs,
    start_generation_job,
)
from app.services.workspace_service import WorkspacePermissionError

router = APIRouter(
    prefix="/workspaces/{workspace_id}/projects/{project_id}/srs",
    tags=["srs"],
)


@router.post("/inputs", response_model=RequirementInputRead, status_code=status.HTTP_201_CREATED)
def submit_requirement_input(
    project_id: UUID,
    payload: RequirementInputCreateRequest,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> RequirementInput:
    try:
        return create_requirement_input(
            db,
            membership=membership,
            project_id=project_id,
            title=payload.title,
            raw_text=payload.raw_text,
        )
    except WorkspacePermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except GenerationJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidSrsRequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post("/generate", response_model=SrsGenerateResponse, status_code=status.HTTP_201_CREATED)
def generate_srs(
    project_id: UUID,
    payload: SrsGenerateRequest,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> SrsGenerateResponse:
    try:
        requirement_input, job = start_generation_job(
            db,
            membership=membership,
            project_id=project_id,
            title=payload.title,
            raw_text=payload.raw_text,
            generate_class_diagram=payload.generate_class_diagram,
            diagram_methods=payload.diagram_methods,
        )
    except WorkspacePermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except GenerationJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except BillingError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except InvalidSrsRequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    return SrsGenerateResponse(requirement_input=requirement_input, job=job)


@router.get("/jobs", response_model=list[GenerationJobRead])
def get_jobs(
    project_id: UUID,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> list[GenerationJob]:
    try:
        return list_generation_jobs(db, membership=membership, project_id=project_id)
    except GenerationJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/jobs/{job_id}", response_model=GenerationJobRead)
def get_job(
    project_id: UUID,
    job_id: UUID,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> GenerationJob:
    try:
        return get_generation_job(
            db, membership=membership, project_id=project_id, job_id=job_id
        )
    except GenerationJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc