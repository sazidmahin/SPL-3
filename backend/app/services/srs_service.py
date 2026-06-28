from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import GenerationJob, RequirementInput, WorkspaceMember
from app.services.billing_service import record_feature_usage
from app.services.project_service import ProjectNotFoundError, get_active_project
from app.services.workspace_service import require_workspace_role

GENERATION_MUTATION_ROLES = {"owner", "admin", "member"}
GENERATION_JOB_STATUSES = {"pending", "running", "completed", "failed", "partially_completed"}
GENERATION_JOB_TYPES = {"srs", "class_diagram", "full"}
DIAGRAM_METHODS = {"llm", "rule_based"}


class SrsError(Exception):
    """Base class for expected SRS generation failures."""


class InvalidSrsRequestError(SrsError):
    pass


class GenerationJobNotFoundError(SrsError):
    pass


def _clean_required(value: str, message: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise InvalidSrsRequestError(message)
    return cleaned


def _ensure_project_access(
    db: Session, *, membership: WorkspaceMember, project_id: UUID
) -> None:
    try:
        get_active_project(db, workspace_id=membership.workspace_id, project_id=project_id)
    except ProjectNotFoundError as exc:
        raise GenerationJobNotFoundError("Project not found") from exc


def _normalize_diagram_methods(methods: list[str]) -> list[str]:
    normalized = []
    for method in methods:
        cleaned = method.strip().lower()
        if cleaned not in DIAGRAM_METHODS:
            raise InvalidSrsRequestError("Invalid diagram generation method")
        if cleaned not in normalized:
            normalized.append(cleaned)
    return normalized


def create_requirement_input(
    db: Session,
    *,
    membership: WorkspaceMember,
    project_id: UUID,
    title: str,
    raw_text: str,
) -> RequirementInput:
    require_workspace_role(membership, allowed_roles=GENERATION_MUTATION_ROLES)
    _ensure_project_access(db, membership=membership, project_id=project_id)

    requirement_input = RequirementInput(
        workspace_id=membership.workspace_id,
        project_id=project_id,
        title=_clean_required(title, "Requirement title is required"),
        raw_text=_clean_required(raw_text, "Requirement text is required"),
        created_by_user_id=membership.user_id,
    )
    db.add(requirement_input)
    db.commit()
    db.refresh(requirement_input)
    return requirement_input


def start_generation_job(
    db: Session,
    *,
    membership: WorkspaceMember,
    project_id: UUID,
    title: str,
    raw_text: str,
    generate_class_diagram: bool,
    diagram_methods: list[str],
) -> tuple[RequirementInput, GenerationJob]:
    require_workspace_role(membership, allowed_roles=GENERATION_MUTATION_ROLES)
    _ensure_project_access(db, membership=membership, project_id=project_id)
    record_feature_usage(db, workspace_id=membership.workspace_id, feature="srs_generation")

    normalized_methods = _normalize_diagram_methods(diagram_methods)
    requirement_input = RequirementInput(
        workspace_id=membership.workspace_id,
        project_id=project_id,
        title=_clean_required(title, "Requirement title is required"),
        raw_text=_clean_required(raw_text, "Requirement text is required"),
        created_by_user_id=membership.user_id,
    )
    db.add(requirement_input)
    db.flush()

    job_type = "full" if generate_class_diagram else "srs"
    generation_job = GenerationJob(
        workspace_id=membership.workspace_id,
        project_id=project_id,
        requirement_input_id=requirement_input.id,
        job_type=job_type,
        status="pending",
        progress_percent=0,
        generate_class_diagram=generate_class_diagram,
        diagram_methods=normalized_methods,
        result_payload=None,
        error_message=None,
        created_by_user_id=membership.user_id,
    )
    db.add(generation_job)
    db.commit()
    db.refresh(requirement_input)
    db.refresh(generation_job)
    return requirement_input, generation_job


def list_generation_jobs(
    db: Session, *, membership: WorkspaceMember, project_id: UUID
) -> list[GenerationJob]:
    _ensure_project_access(db, membership=membership, project_id=project_id)
    return list(
        db.scalars(
            select(GenerationJob)
            .where(
                GenerationJob.workspace_id == membership.workspace_id,
                GenerationJob.project_id == project_id,
            )
            .order_by(GenerationJob.created_at.desc())
        )
    )


def get_generation_job(
    db: Session, *, membership: WorkspaceMember, project_id: UUID, job_id: UUID
) -> GenerationJob:
    _ensure_project_access(db, membership=membership, project_id=project_id)
    job = db.scalar(
        select(GenerationJob).where(
            GenerationJob.id == job_id,
            GenerationJob.workspace_id == membership.workspace_id,
            GenerationJob.project_id == project_id,
        )
    )
    if job is None:
        raise GenerationJobNotFoundError("Generation job not found")
    return job