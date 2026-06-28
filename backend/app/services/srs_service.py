from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.domain.srs import (
    RequirementDraft,
    build_summary_sections,
    build_srs_document,
    classify_requirement_drafts,
    extract_requirement_drafts,
)
from app.db.models import (
    Diagram,
    ExtractedRequirement,
    GenerationJob,
    LlmCall,
    RequirementInput,
    SrsDocument,
    WorkspaceMember,
)
from app.services.billing_service import BillingError, record_feature_usage
from app.services.diagram_generation_service import (
    DiagramGenerationError,
    InvalidDiagramGenerationRequestError,
    generate_class_diagram as generate_class_diagram_artifact,
)
from app.services.llm_service import execute_llm_call, get_or_create_prompt_template
from app.services.project_service import ProjectNotFoundError, get_active_project
from app.services.workspace_service import require_workspace_role

GENERATION_MUTATION_ROLES = {"owner", "admin", "member"}
DIAGRAM_METHODS = {"llm", "rule_based"}
ACTIVE_DOCUMENT_STATUS = "active"


class SrsError(Exception):
    """Base class for expected SRS generation failures."""


class InvalidSrsRequestError(SrsError):
    pass


class GenerationJobNotFoundError(SrsError):
    pass


class SrsDocumentNotFoundError(SrsError):
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


def generate_summary_sections(
    db: Session,
    *,
    workspace_id: UUID,
    project_id: UUID,
    generation_job_id: UUID,
    raw_text: str,
) -> dict:
    template = get_or_create_prompt_template(
        db,
        name="srs_summary_sections",
        purpose="summary",
        template_text="Create SRS summary sections from: {raw_text}",
    )
    execute_llm_call(
        db,
        workspace_id=workspace_id,
        project_id=project_id,
        generation_job_id=generation_job_id,
        template=template,
        variables={"raw_text": raw_text},
    )

    return build_summary_sections(raw_text)

def extract_structured_requirements(
    db: Session,
    *,
    workspace_id: UUID,
    project_id: UUID,
    generation_job_id: UUID,
    raw_text: str,
) -> list[RequirementDraft]:
    template = get_or_create_prompt_template(
        db,
        name="srs_requirement_extraction",
        purpose="requirement_extraction",
        template_text="Extract atomic requirements from: {raw_text}",
    )
    execute_llm_call(
        db,
        workspace_id=workspace_id,
        project_id=project_id,
        generation_job_id=generation_job_id,
        template=template,
        variables={"raw_text": raw_text},
    )

    return extract_requirement_drafts(raw_text)


def classify_requirements(
    db: Session,
    *,
    workspace_id: UUID,
    project_id: UUID,
    generation_job_id: UUID,
    requirements: list[RequirementDraft],
) -> list[RequirementDraft]:
    template = get_or_create_prompt_template(
        db,
        name="srs_requirement_classification",
        purpose="requirement_classification",
        template_text="Classify requirements: {requirements}",
    )
    execute_llm_call(
        db,
        workspace_id=workspace_id,
        project_id=project_id,
        generation_job_id=generation_job_id,
        template=template,
        variables={"requirements": "\n".join(item.requirement_text for item in requirements)},
    )

    return classify_requirement_drafts(requirements)



def _generation_metadata(db: Session, *, workspace_id: UUID, project_id: UUID, generation_job_id: UUID) -> dict:
    calls = list(
        db.scalars(
            select(LlmCall)
            .where(
                LlmCall.workspace_id == workspace_id,
                LlmCall.project_id == project_id,
                LlmCall.generation_job_id == generation_job_id,
            )
            .order_by(LlmCall.created_at.asc())
        )
    )
    return {
        "generation_job_id": str(generation_job_id),
        "llm_calls": [
            {
                "id": str(call.id),
                "prompt_template_id": str(call.prompt_template_id) if call.prompt_template_id else None,
                "provider": call.provider,
                "model_name": call.model_name,
                "status": call.status,
                "total_tokens": call.total_tokens,
            }
            for call in calls
        ],
    }

def start_generation_job(
    db: Session,
    *,
    membership: WorkspaceMember,
    project_id: UUID,
    title: str,
    raw_text: str,
    generate_class_diagram: bool,
    diagram_methods: list[str],
) -> tuple[RequirementInput, GenerationJob, SrsDocument, list[Diagram]]:
    require_workspace_role(membership, allowed_roles=GENERATION_MUTATION_ROLES)
    _ensure_project_access(db, membership=membership, project_id=project_id)
    record_feature_usage(db, workspace_id=membership.workspace_id, feature="srs_generation")

    normalized_methods = _normalize_diagram_methods(diagram_methods)
    if generate_class_diagram and not normalized_methods:
        normalized_methods = ["rule_based"]
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

    generation_job.status = "running"
    generation_job.progress_percent = 10
    generation_job.started_at = datetime.now(UTC)
    db.commit()

    summary = generate_summary_sections(
        db,
        workspace_id=membership.workspace_id,
        project_id=project_id,
        generation_job_id=generation_job.id,
        raw_text=requirement_input.raw_text,
    )
    generation_job.progress_percent = 35
    db.commit()

    extracted = extract_structured_requirements(
        db,
        workspace_id=membership.workspace_id,
        project_id=project_id,
        generation_job_id=generation_job.id,
        raw_text=requirement_input.raw_text,
    )
    generation_job.progress_percent = 60
    db.commit()

    classified = classify_requirements(
        db,
        workspace_id=membership.workspace_id,
        project_id=project_id,
        generation_job_id=generation_job.id,
        requirements=extracted,
    )
    markdown, content_json = build_srs_document(requirement_input.title, summary, classified)
    content_json["generation_metadata"] = _generation_metadata(
        db,
        workspace_id=membership.workspace_id,
        project_id=project_id,
        generation_job_id=generation_job.id,
    )

    srs_document = SrsDocument(
        workspace_id=membership.workspace_id,
        project_id=project_id,
        requirement_input_id=requirement_input.id,
        generation_job_id=generation_job.id,
        title=requirement_input.title,
        status=ACTIVE_DOCUMENT_STATUS,
        content_markdown=markdown,
        content_json=content_json,
        created_by_user_id=membership.user_id,
    )
    db.add(srs_document)
    db.flush()

    for item in classified:
        db.add(
            ExtractedRequirement(
                workspace_id=membership.workspace_id,
                project_id=project_id,
                srs_document_id=srs_document.id,
                requirement_input_id=requirement_input.id,
                generation_job_id=generation_job.id,
                requirement_code=item.requirement_code,
                requirement_text=item.requirement_text,
                requirement_type=item.requirement_type,
                nfr_subtype=item.nfr_subtype,
                source_trace=item.source_trace,
                extraction_reason=item.extraction_reason,
                confidence_score=item.confidence_score,
            )
        )

    db.flush()
    generated_diagrams: list[Diagram] = []
    diagram_error: str | None = None
    if generate_class_diagram:
        generation_job.progress_percent = 80
        db.commit()
        try:
            generated_diagrams.append(
                generate_class_diagram_artifact(
                    db,
                    membership=membership,
                    project_id=project_id,
                    requirement_input_id=None,
                    srs_document_id=srs_document.id,
                    methods=normalized_methods,
                )
            )
        except (BillingError, DiagramGenerationError, InvalidDiagramGenerationRequestError) as exc:
            diagram_error = str(exc)

    generation_job.status = "partially_completed" if diagram_error else "completed"
    generation_job.progress_percent = 100
    generation_job.completed_at = datetime.now(UTC)
    generation_job.error_message = diagram_error
    generation_job.result_payload = {
        "srs_document_id": str(srs_document.id),
        "requirement_count": len(classified),
        "functional_count": len([item for item in classified if item.requirement_type == "functional"]),
        "non_functional_count": len([item for item in classified if item.requirement_type == "non_functional"]),
        "diagram_ids": [str(diagram.id) for diagram in generated_diagrams],
        "diagram_count": len(generated_diagrams),
    }
    db.commit()
    db.refresh(generation_job)
    return (
        requirement_input,
        generation_job,
        get_srs_document(db, membership=membership, project_id=project_id, srs_document_id=srs_document.id),
        generated_diagrams,
    )

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

def list_srs_documents(
    db: Session, *, membership: WorkspaceMember, project_id: UUID
) -> list[SrsDocument]:
    _ensure_project_access(db, membership=membership, project_id=project_id)
    return list(
        db.scalars(
            select(SrsDocument)
            .where(
                SrsDocument.workspace_id == membership.workspace_id,
                SrsDocument.project_id == project_id,
                SrsDocument.status == ACTIVE_DOCUMENT_STATUS,
            )
            .order_by(SrsDocument.created_at.desc())
        )
    )

def get_srs_document(
    db: Session, *, membership: WorkspaceMember, project_id: UUID, srs_document_id: UUID
) -> SrsDocument:
    _ensure_project_access(db, membership=membership, project_id=project_id)
    document = db.scalar(
        select(SrsDocument)
        .options(selectinload(SrsDocument.extracted_requirements))
        .where(
            SrsDocument.id == srs_document_id,
            SrsDocument.workspace_id == membership.workspace_id,
            SrsDocument.project_id == project_id,
            SrsDocument.status == ACTIVE_DOCUMENT_STATUS,
        )
    )
    if document is None:
        raise SrsDocumentNotFoundError("SRS document not found")
    return document