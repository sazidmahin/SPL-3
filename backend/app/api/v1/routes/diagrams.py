from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_workspace_membership, get_db
from app.db.models import Diagram, DiagramRequirementLink, DiagramVersion, WorkspaceMember
from app.schemas.diagram import (
    ClassDiagramGenerateRequest,
    DiagramCreateRequest,
    DiagramDetailRead,
    DiagramRead,
    DiagramVersionCreateRequest,
    DiagramVersionRead,
)
from app.services.billing_service import BillingError, require_feature_access
from app.services.diagram_generation_service import (
    DiagramGenerationError,
    DiagramGenerationSourceNotFoundError,
    InvalidDiagramGenerationRequestError,
    generate_class_diagram,
)
from app.services.diagram_service import (
    DiagramNotFoundError,
    InvalidDiagramError,
    create_manual_diagram,
    get_diagram_detail,
    list_active_diagrams,
    list_diagram_requirement_links,
    list_diagram_versions,
    save_diagram_version,
)
from app.services.workspace_service import WorkspacePermissionError

router = APIRouter(
    prefix="/workspaces/{workspace_id}/projects/{project_id}/diagrams",
    tags=["diagrams"],
)


def _detail_response(
    diagram: Diagram, current: DiagramVersion, links: list[DiagramRequirementLink] | None = None
) -> DiagramDetailRead:
    return DiagramDetailRead.model_validate(
        {**diagram.__dict__, "current": current, "requirement_links": links or []}
    )


def _load_detail_response(
    db: Session, *, membership: WorkspaceMember, project_id: UUID, diagram_id: UUID
) -> DiagramDetailRead:
    diagram, current = get_diagram_detail(
        db, membership=membership, project_id=project_id, diagram_id=diagram_id
    )
    links = list_diagram_requirement_links(
        db, membership=membership, project_id=project_id, diagram_id=diagram.id
    )
    return _detail_response(diagram, current, links)


@router.post("", response_model=DiagramDetailRead, status_code=status.HTTP_201_CREATED)
def create_diagram(
    project_id: UUID,
    payload: DiagramCreateRequest,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> DiagramDetailRead:
    try:
        diagram = create_manual_diagram(
            db,
            membership=membership,
            project_id=project_id,
            title=payload.title,
            diagram_type=payload.diagram_type,
            drawio_xml=payload.drawio_xml,
            diagram_json=payload.diagram_json,
        )
        return _load_detail_response(db, membership=membership, project_id=project_id, diagram_id=diagram.id)
    except WorkspacePermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except BillingError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except DiagramNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidDiagramError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.post("/class/generate", response_model=DiagramDetailRead, status_code=status.HTTP_201_CREATED)
def generate_class_diagram_route(
    project_id: UUID,
    payload: ClassDiagramGenerateRequest,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> DiagramDetailRead:
    try:
        diagram = generate_class_diagram(
            db,
            membership=membership,
            project_id=project_id,
            requirement_input_id=payload.requirement_input_id,
            srs_document_id=payload.srs_document_id,
            methods=payload.methods,
        )
        return _load_detail_response(db, membership=membership, project_id=project_id, diagram_id=diagram.id)
    except WorkspacePermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except BillingError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except DiagramGenerationSourceNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except (DiagramGenerationError, InvalidDiagramGenerationRequestError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.get("", response_model=list[DiagramRead])
def list_diagrams(
    project_id: UUID,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> list[Diagram]:
    try:
        return list_active_diagrams(db, membership=membership, project_id=project_id)
    except BillingError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except DiagramNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{diagram_id}/export", response_class=Response)
def export_diagram(
    project_id: UUID,
    diagram_id: UUID,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> Response:
    try:
        require_feature_access(db, workspace_id=membership.workspace_id, feature="export_diagrams")
        diagram, current = get_diagram_detail(
            db, membership=membership, project_id=project_id, diagram_id=diagram_id
        )
    except BillingError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except DiagramNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    filename = f"{diagram.title.strip().replace(' ', '-') or 'diagram'}.drawio"
    return Response(
        content=current.drawio_xml,
        media_type="application/xml; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{diagram_id}", response_model=DiagramDetailRead)
def get_diagram(
    project_id: UUID,
    diagram_id: UUID,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> DiagramDetailRead:
    try:
        return _load_detail_response(db, membership=membership, project_id=project_id, diagram_id=diagram_id)
    except BillingError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except DiagramNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post(
    "/{diagram_id}/versions",
    response_model=DiagramVersionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_diagram_version(
    project_id: UUID,
    diagram_id: UUID,
    payload: DiagramVersionCreateRequest,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> DiagramVersion:
    try:
        return save_diagram_version(
            db,
            membership=membership,
            project_id=project_id,
            diagram_id=diagram_id,
            drawio_xml=payload.drawio_xml,
            diagram_json=payload.diagram_json,
        )
    except WorkspacePermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except BillingError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except DiagramNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidDiagramError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.get("/{diagram_id}/versions", response_model=list[DiagramVersionRead])
def get_versions(
    project_id: UUID,
    diagram_id: UUID,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> list[DiagramVersion]:
    try:
        return list_diagram_versions(
            db, membership=membership, project_id=project_id, diagram_id=diagram_id
        )
    except BillingError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except DiagramNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc