from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_workspace_membership, get_db
from app.db.models import Diagram, GenerationJob, RequirementInput, SrsDocument, WorkspaceMember
from app.schemas.diagram import DiagramDetailRead
from app.schemas.srs import (
    ClarificationAnswerRequest,
    ClarificationAnswerResponse,
    GenerationJobRead,
    RequirementInputCreateRequest,
    RequirementInputRead,
    SrsDocumentDetailRead,
    SrsDocumentRead,
    SrsGenerateRequest,
    SrsGenerateResponse,
    SrsIntakeRequest,
    SrsIntakeResponse,
)
from app.services.billing_service import BillingError, require_feature_access
from app.services.diagram_service import get_diagram_detail, list_diagram_requirement_links
from app.services.srs_service import (
    GenerationJobNotFoundError,
    InvalidSrsRequestError,
    SrsDocumentNotFoundError,
    answer_requirement_clarifications,
    create_requirement_input,
    create_requirement_intake,
    get_generation_job,
    get_srs_document,
    list_generation_jobs,
    list_srs_documents,
    start_generation_job,
)
from app.services.workspace_service import WorkspacePermissionError

router = APIRouter(
    prefix="/workspaces/{workspace_id}/projects/{project_id}/srs",
    tags=["srs"],
)


def _diagram_detail_response(
    db: Session, *, membership: WorkspaceMember, project_id: UUID, diagram: Diagram
) -> DiagramDetailRead:
    detail_diagram, current = get_diagram_detail(
        db, membership=membership, project_id=project_id, diagram_id=diagram.id
    )
    links = list_diagram_requirement_links(
        db, membership=membership, project_id=project_id, diagram_id=diagram.id
    )
    return DiagramDetailRead.model_validate(
        {**detail_diagram.__dict__, "current": current, "requirement_links": links}
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
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.post("/intake", response_model=SrsIntakeResponse, status_code=status.HTTP_201_CREATED)
def intake_requirement(
    project_id: UUID,
    payload: SrsIntakeRequest,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> SrsIntakeResponse:
    try:
        requirement_input, needs_clarification, draft = create_requirement_intake(
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
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    return SrsIntakeResponse(
        requirement_input=requirement_input,
        needs_clarification=needs_clarification,
        clarifying_questions=requirement_input.clarifying_questions,
        draft_requirement=draft,
    )


@router.post(
    "/inputs/{requirement_input_id}/clarifications",
    response_model=ClarificationAnswerResponse,
)
def answer_clarifications(
    project_id: UUID,
    requirement_input_id: UUID,
    payload: ClarificationAnswerRequest,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> ClarificationAnswerResponse:
    try:
        requirement_input, refined = answer_requirement_clarifications(
            db,
            membership=membership,
            project_id=project_id,
            requirement_input_id=requirement_input_id,
            answers=[item.model_dump() for item in payload.answers],
        )
    except WorkspacePermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except GenerationJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidSrsRequestError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    return ClarificationAnswerResponse(
        requirement_input=requirement_input,
        needs_clarification=False,
        refined_requirement=refined,
    )


@router.post("/generate", response_model=SrsGenerateResponse, status_code=status.HTTP_201_CREATED)
def generate_srs(
    project_id: UUID,
    payload: SrsGenerateRequest,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> SrsGenerateResponse:
    try:
        requirement_input, job, srs_document, diagrams = start_generation_job(
            db,
            membership=membership,
            project_id=project_id,
            requirement_input_id=payload.requirement_input_id,
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
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except InvalidSrsRequestError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    return SrsGenerateResponse(
        requirement_input=requirement_input,
        job=job,
        srs_document=srs_document,
        diagrams=[
            _diagram_detail_response(db, membership=membership, project_id=project_id, diagram=diagram)
            for diagram in diagrams
        ],
    )


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
        return get_generation_job(db, membership=membership, project_id=project_id, job_id=job_id)
    except GenerationJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("", response_model=list[SrsDocumentRead])
def get_srs_documents(
    project_id: UUID,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> list[SrsDocument]:
    try:
        return list_srs_documents(db, membership=membership, project_id=project_id)
    except GenerationJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{srs_document_id}/export", response_class=Response)
def export_srs_document(
    project_id: UUID,
    srs_document_id: UUID,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> Response:
    try:
        require_feature_access(db, workspace_id=membership.workspace_id, feature="export_srs")
        document = get_srs_document(
            db,
            membership=membership,
            project_id=project_id,
            srs_document_id=srs_document_id,
        )
    except BillingError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except (GenerationJobNotFoundError, SrsDocumentNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    filename = f"{document.title.strip().replace(' ', '-') or 'srs-document'}.md"
    return Response(
        content=document.content_markdown,
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{srs_document_id}", response_model=SrsDocumentDetailRead)
def get_srs_document_detail(
    project_id: UUID,
    srs_document_id: UUID,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> SrsDocument:
    try:
        return get_srs_document(
            db,
            membership=membership,
            project_id=project_id,
            srs_document_id=srs_document_id,
        )
    except (GenerationJobNotFoundError, SrsDocumentNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
