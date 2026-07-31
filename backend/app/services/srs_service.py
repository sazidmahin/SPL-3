import json
import re
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any, TypedDict
from uuid import UUID

from langgraph.graph import END, START, StateGraph
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload, sessionmaker

from app.domain.srs import RequirementDraft, build_srs_document
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
from app.services.llm_service import (
    LlmClient,
    LlmExecutionError,
    execute_llm_call,
    get_or_create_prompt_template,
)
from app.services.project_service import ProjectNotFoundError, get_active_project
from app.services.workspace_service import require_workspace_role

GENERATION_MUTATION_ROLES = {"owner", "admin", "member"}
DIAGRAM_METHODS = {"llm", "rule_based"}
ACTIVE_DOCUMENT_STATUS = "active"
CLARIFICATION_NOT_REQUIRED = "not_required"
CLARIFICATION_PENDING = "pending"
CLARIFICATION_CLARIFIED = "clarified"
SRS_SUMMARY_PROMPT_TEMPLATE = """
You are a requirements assistant following the REQINONE Summary Task.
Generate only summary-type SRS sections from the provided stakeholder natural language.
Do not invent unsupported stakeholders, use cases, or glossary terms. Every item must be grounded in the source text.

Return valid JSON only, with this exact shape:
{
  "introduction": "one concise paragraph grounded in the source",
  "stakeholders": ["stakeholder or user group with source evidence"],
  "use_cases": ["UC-001: use case grounded in source evidence"],
  "glossary": [
    {"term": "domain term", "definition": "definition grounded in source text"}
  ]
}

Source text:
{raw_text}
"""
SRS_REQUIREMENT_EXTRACTION_PROMPT_TEMPLATE = """
You are a requirements assistant following the REQINONE Requirement Extraction Task.
Extract atomic software requirements from stakeholder natural language.
A requirement is a capability, constraint, condition, or quality the system must satisfy.
Express each requirement using this INCOSE-style pattern where possible:
The <subject clause> shall <action verb clause> <object clause> <optional qualifying clause>, when <condition clause>.
For every requirement, include the source sentence and extraction reason to preserve traceability and reduce hallucination.

Return valid JSON only, with this exact shape:
{
  "requirements": [
    {
      "requirement_code": "REQ-001",
      "requirement_text": "The system shall ...",
      "source_trace": "source sentence from the input",
      "extraction_reason": "why this is a requirement grounded in source text",
      "confidence_score": 0.0
    }
  ]
}

Source text:
{raw_text}
"""
SRS_REQUIREMENT_CLASSIFICATION_PROMPT_TEMPLATE = """
You are a requirements classification assistant following the REQINONE Requirement Classification Task.
Classify each requirement as functional or non-functional.
Functional requirements describe system behavior. Non-functional requirements describe quality attributes, constraints, operating conditions, or compliance concerns.
For non-functional requirements, choose the most specific subtype from: Security, Performance, Availability, Usability, Scalability, Maintainability, Portability, Legal, Fault Tolerance, Operational, Look & Feel.
Preserve requirement_code, requirement_text, source_trace, extraction_reason, and confidence_score from the input. Add a grounded classification rationale.

Examples:
- "The system shall allow users to reset passwords" -> functional.
- "The system shall respond within two seconds" -> non_functional, Performance.
- "The system shall encrypt stored passwords" -> non_functional, Security.

Return valid JSON only, with this exact shape:
{
  "requirements": [
    {
      "requirement_code": "REQ-001",
      "requirement_text": "The system shall ...",
      "source_trace": "source sentence from the input",
      "extraction_reason": "why this is a requirement grounded in source text",
      "confidence_score": 0.0,
      "requirement_type": "functional",
      "nfr_subtype": null,
      "classification_rationale": "why this classification is correct"
    }
  ]
}

Requirements JSON:
{requirements}
"""


class SrsError(Exception):
    """Base class for expected SRS generation failures."""


class InvalidSrsRequestError(SrsError):
    pass


class GenerationJobNotFoundError(SrsError):
    pass


class SrsDocumentNotFoundError(SrsError):
    pass


class InvalidLlmSrsOutputError(InvalidSrsRequestError):
    pass


class SrsPipelineStageError(InvalidSrsRequestError):
    def __init__(self, stage: str, exc: Exception) -> None:
        self.stage = stage
        super().__init__(str(exc))


class SrsGenerationGraphState(TypedDict, total=False):
    workspace_id: UUID
    project_id: UUID
    generation_job_id: UUID
    raw_text: str
    summary: dict[str, Any]
    extracted: list[RequirementDraft]
    classified: list[RequirementDraft]


JSON_OBJECT_PATTERN = re.compile(r"\{.*\}", re.DOTALL)
ALLOWED_REQUIREMENT_TYPES = {"functional", "non_functional"}
ALLOWED_NFR_SUBTYPES = {
    "Security",
    "Performance",
    "Availability",
    "Usability",
    "Scalability",
    "Maintainability",
    "Portability",
    "Legal",
    "Fault Tolerance",
    "Operational",
    "Look & Feel",
}


def _llm_content(call: LlmCall) -> str:
    payload = call.response_payload or {}
    content = payload.get("content")
    if not isinstance(content, str) or not content.strip():
        raise InvalidLlmSrsOutputError("LLM response did not contain text content")
    return content.strip()


def _parse_llm_json(content: str) -> dict[str, Any]:
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        match = JSON_OBJECT_PATTERN.search(cleaned)
        if match is None:
            raise InvalidLlmSrsOutputError("LLM response was not valid JSON") from None
        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise InvalidLlmSrsOutputError("LLM response JSON could not be parsed") from exc

    if not isinstance(parsed, dict):
        raise InvalidLlmSrsOutputError("LLM response JSON must be an object")
    return parsed


def _required_string(payload: dict[str, Any], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        raise InvalidLlmSrsOutputError(f"LLM response missing required string: {key}")
    return value.strip()


def _string_list(payload: dict[str, Any], key: str) -> list[str]:
    value = payload.get(key)
    if not isinstance(value, list):
        raise InvalidLlmSrsOutputError(f"LLM response missing required list: {key}")
    items = [str(item).strip() for item in value if str(item).strip()]
    if not items:
        raise InvalidLlmSrsOutputError(f"LLM response list cannot be empty: {key}")
    return items


def _parse_summary_payload(call: LlmCall) -> dict[str, Any]:
    payload = _parse_llm_json(_llm_content(call))
    glossary = payload.get("glossary", [])
    if not isinstance(glossary, list):
        raise InvalidLlmSrsOutputError("LLM summary glossary must be a list")

    normalized_glossary = []
    for item in glossary:
        if not isinstance(item, dict):
            raise InvalidLlmSrsOutputError("LLM summary glossary items must be objects")
        normalized_glossary.append(
            {
                "term": _required_string(item, "term"),
                "definition": _required_string(item, "definition"),
            }
        )

    return {
        "introduction": _required_string(payload, "introduction"),
        "stakeholders": _string_list(payload, "stakeholders"),
        "use_cases": _string_list(payload, "use_cases"),
        "glossary": normalized_glossary,
    }


def _confidence(value: Any) -> float:
    try:
        score = float(value)
    except (TypeError, ValueError):
        raise InvalidLlmSrsOutputError("LLM requirement confidence_score must be numeric") from None
    return max(0.0, min(1.0, score))


def _parse_requirement_item(item: Any, *, index: int, classified: bool) -> RequirementDraft:
    if not isinstance(item, dict):
        raise InvalidLlmSrsOutputError("LLM requirement items must be objects")

    requirement_type = str(item.get("requirement_type", "functional")).strip().lower()
    nfr_subtype = item.get("nfr_subtype")
    if classified:
        if requirement_type not in ALLOWED_REQUIREMENT_TYPES:
            raise InvalidLlmSrsOutputError("LLM requirement_type must be functional or non_functional")
        if requirement_type == "non_functional":
            if not isinstance(nfr_subtype, str) or nfr_subtype.strip() not in ALLOWED_NFR_SUBTYPES:
                raise InvalidLlmSrsOutputError("LLM non-functional requirement needs a valid nfr_subtype")
            normalized_subtype = nfr_subtype.strip()
        else:
            normalized_subtype = None
    else:
        requirement_type = "functional"
        normalized_subtype = None

    return RequirementDraft(
        requirement_code=str(item.get("requirement_code") or f"REQ-{index:03d}").strip(),
        requirement_text=_required_string(item, "requirement_text"),
        source_trace=_required_string(item, "source_trace"),
        extraction_reason=_required_string(item, "extraction_reason"),
        confidence_score=_confidence(item.get("confidence_score", 0.8)),
        requirement_type=requirement_type,
        nfr_subtype=normalized_subtype,
    )


def _parse_requirements_payload(call: LlmCall, *, classified: bool) -> list[RequirementDraft]:
    payload = _parse_llm_json(_llm_content(call))
    items = payload.get("requirements")
    if not isinstance(items, list) or not items:
        raise InvalidLlmSrsOutputError("LLM response must include at least one requirement")
    return [_parse_requirement_item(item, index=index, classified=classified) for index, item in enumerate(items, start=1)]


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


def _get_requirement_input(
    db: Session, *, membership: WorkspaceMember, project_id: UUID, requirement_input_id: UUID
) -> RequirementInput:
    _ensure_project_access(db, membership=membership, project_id=project_id)
    requirement_input = db.scalar(
        select(RequirementInput).where(
            RequirementInput.id == requirement_input_id,
            RequirementInput.workspace_id == membership.workspace_id,
            RequirementInput.project_id == project_id,
        )
    )
    if requirement_input is None:
        raise GenerationJobNotFoundError("Requirement input not found")
    return requirement_input


def _clarifying_questions(raw_text: str) -> list[dict[str, str]]:
    text = raw_text.lower()
    words = [word for word in text.replace(".", " ").replace(",", " ").split() if word]
    questions: list[dict[str, str]] = []

    actor_terms = {
        "user", "users", "patient", "patients", "doctor", "doctors", "admin", "admins",
        "student", "students", "teacher", "teachers", "customer", "customers", "staff",
        "member", "members", "librarian", "librarians",
    }
    action_terms = {
        "create", "add", "update", "delete", "search", "view", "book", "cancel", "reschedule",
        "approve", "reject", "pay", "track", "upload", "download", "assign", "manage", "generate", "borrow", "return", "receive",
    }
    notification_terms = {"notify", "notification", "notifications", "email", "sms", "confirmation", "confirmations", "confirm"}
    security_terms = {"login", "log", "signin", "sign", "password", "role", "permission", "authenticate"}

    if len(words) < 12:
        questions.append(
            {
                "id": "scope",
                "question": "What are the main tasks the system must support?",
                "reason": "The requirement is short and does not describe enough workflow detail.",
            }
        )
    if not actor_terms.intersection(words):
        questions.append(
            {
                "id": "actors",
                "question": "Who will use the system, and what roles should they have?",
                "reason": "The requirement does not clearly identify user roles.",
            }
        )
    if not action_terms.intersection(words):
        questions.append(
            {
                "id": "actions",
                "question": "What actions should users be able to perform in the system?",
                "reason": "The requirement does not describe concrete system actions.",
            }
        )
    if not security_terms.intersection(words):
        questions.append(
            {
                "id": "access_control",
                "question": "Should users log in, and should different roles have different permissions?",
                "reason": "Authentication and authorization expectations are not specified.",
            }
        )
    if not notification_terms.intersection(words):
        questions.append(
            {
                "id": "notifications",
                "question": "Should the system send confirmations or notifications for important actions?",
                "reason": "The requirement does not mention user feedback or notification behavior.",
            }
        )

    return questions[:5]


def _draft_requirement(title: str, raw_text: str) -> str:
    cleaned_text = _clean_required(raw_text, "Requirement text is required").rstrip(".")
    if "shall" in cleaned_text.lower():
        return f"{cleaned_text}."
    return f"The {title.strip()} shall support {cleaned_text}."


def _refine_requirement(title: str, raw_text: str, answers: list[dict[str, str]]) -> str:
    answer_text = " ".join(
        f"{item['answer'].strip().rstrip('.')} ." for item in answers if item.get("answer", "").strip()
    ).replace(" .", ".")
    base = _draft_requirement(title, raw_text)
    if not answer_text:
        return base
    return f"{base} Clarified requirements: {answer_text}"


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
        clarification_status=CLARIFICATION_NOT_REQUIRED,
        clarifying_questions=[],
        clarification_answers=[],
        refined_text=None,
        refinement_metadata=None,
        created_by_user_id=membership.user_id,
    )
    db.add(requirement_input)
    db.commit()
    db.refresh(requirement_input)
    return requirement_input


def create_requirement_intake(
    db: Session,
    *,
    membership: WorkspaceMember,
    project_id: UUID,
    title: str,
    raw_text: str,
) -> tuple[RequirementInput, bool, str]:
    require_workspace_role(membership, allowed_roles=GENERATION_MUTATION_ROLES)
    _ensure_project_access(db, membership=membership, project_id=project_id)

    cleaned_title = _clean_required(title, "Requirement title is required")
    cleaned_text = _clean_required(raw_text, "Requirement text is required")
    questions = _clarifying_questions(cleaned_text)
    draft = _draft_requirement(cleaned_title, cleaned_text)
    requirement_input = RequirementInput(
        workspace_id=membership.workspace_id,
        project_id=project_id,
        title=cleaned_title,
        raw_text=cleaned_text,
        clarification_status=CLARIFICATION_PENDING if questions else CLARIFICATION_NOT_REQUIRED,
        clarifying_questions=questions,
        clarification_answers=[],
        refined_text=None if questions else draft,
        refinement_metadata={"draft_requirement": draft, "engine": "rule_based"},
        created_by_user_id=membership.user_id,
    )
    db.add(requirement_input)
    db.commit()
    db.refresh(requirement_input)
    return requirement_input, bool(questions), draft


def answer_requirement_clarifications(
    db: Session,
    *,
    membership: WorkspaceMember,
    project_id: UUID,
    requirement_input_id: UUID,
    answers: list[dict[str, str]],
) -> tuple[RequirementInput, str]:
    require_workspace_role(membership, allowed_roles=GENERATION_MUTATION_ROLES)
    requirement_input = _get_requirement_input(
        db, membership=membership, project_id=project_id, requirement_input_id=requirement_input_id
    )
    known_question_ids = {item["id"] for item in requirement_input.clarifying_questions or []}
    cleaned_answers = []
    for item in answers:
        question_id = item["question_id"].strip()
        answer = item["answer"].strip()
        if known_question_ids and question_id not in known_question_ids:
            raise InvalidSrsRequestError("Answer references an unknown clarification question")
        cleaned_answers.append({"question_id": question_id, "answer": answer})

    refined = _refine_requirement(requirement_input.title, requirement_input.raw_text, cleaned_answers)
    requirement_input.clarification_answers = cleaned_answers
    requirement_input.refined_text = refined
    requirement_input.clarification_status = CLARIFICATION_CLARIFIED
    requirement_input.refinement_metadata = {
        "engine": "rule_based",
        "answered_question_count": len(cleaned_answers),
    }
    db.commit()
    db.refresh(requirement_input)
    return requirement_input, refined


def generate_summary_sections(
    db: Session,
    *,
    workspace_id: UUID,
    project_id: UUID,
    generation_job_id: UUID,
    raw_text: str,
    client: LlmClient | None = None,
) -> dict:
    template = get_or_create_prompt_template(
        db,
        name="srs_summary_sections",
        purpose="summary",
        template_text=SRS_SUMMARY_PROMPT_TEMPLATE,
    )
    call = execute_llm_call(
        db,
        workspace_id=workspace_id,
        project_id=project_id,
        generation_job_id=generation_job_id,
        template=template,
        variables={"raw_text": raw_text},
        client=client,
    )

    return _parse_summary_payload(call)


def extract_structured_requirements(
    db: Session,
    *,
    workspace_id: UUID,
    project_id: UUID,
    generation_job_id: UUID,
    raw_text: str,
    client: LlmClient | None = None,
) -> list[RequirementDraft]:
    template = get_or_create_prompt_template(
        db,
        name="srs_requirement_extraction",
        purpose="requirement_extraction",
        template_text=SRS_REQUIREMENT_EXTRACTION_PROMPT_TEMPLATE,
    )
    call = execute_llm_call(
        db,
        workspace_id=workspace_id,
        project_id=project_id,
        generation_job_id=generation_job_id,
        template=template,
        variables={"raw_text": raw_text},
        client=client,
    )

    return _parse_requirements_payload(call, classified=False)


def classify_requirements(
    db: Session,
    *,
    workspace_id: UUID,
    project_id: UUID,
    generation_job_id: UUID,
    requirements: list[RequirementDraft],
    client: LlmClient | None = None,
) -> list[RequirementDraft]:
    template = get_or_create_prompt_template(
        db,
        name="srs_requirement_classification",
        purpose="requirement_classification",
        template_text=SRS_REQUIREMENT_CLASSIFICATION_PROMPT_TEMPLATE,
    )
    requirements_payload = json.dumps(
        {"requirements": [item.__dict__ for item in requirements]},
        ensure_ascii=True,
    )
    call = execute_llm_call(
        db,
        workspace_id=workspace_id,
        project_id=project_id,
        generation_job_id=generation_job_id,
        template=template,
        variables={"requirements": requirements_payload},
        client=client,
    )

    return _parse_requirements_payload(call, classified=True)


def _run_srs_llm_graph(
    db: Session,
    *,
    workspace_id: UUID,
    project_id: UUID,
    generation_job_id: UUID,
    raw_text: str,
) -> tuple[dict[str, Any], list[RequirementDraft], list[RequirementDraft]]:
    _sync_srs_prompt_templates(db)
    session_factory = sessionmaker(bind=db.get_bind(), autocommit=False, autoflush=False)

    def with_branch_db(stage: str, callback: Callable[[Session], Any]) -> Any:
        branch_db = session_factory()
        try:
            return callback(branch_db)
        except (InvalidSrsRequestError, LlmExecutionError) as exc:
            raise SrsPipelineStageError(stage, exc) from exc
        finally:
            branch_db.close()

    def summary_node(state: SrsGenerationGraphState) -> dict[str, Any]:
        summary = with_branch_db(
            "summary",
            lambda branch_db: generate_summary_sections(
                branch_db,
                workspace_id=state["workspace_id"],
                project_id=state["project_id"],
                generation_job_id=state["generation_job_id"],
                raw_text=state["raw_text"],
            ),
        )
        return {"summary": summary}

    def extraction_node(state: SrsGenerationGraphState) -> dict[str, Any]:
        extracted = with_branch_db(
            "requirement_extraction",
            lambda branch_db: extract_structured_requirements(
                branch_db,
                workspace_id=state["workspace_id"],
                project_id=state["project_id"],
                generation_job_id=state["generation_job_id"],
                raw_text=state["raw_text"],
            ),
        )
        return {"extracted": extracted}

    def classification_node(state: SrsGenerationGraphState) -> dict[str, Any]:
        extracted = state.get("extracted")
        if not extracted:
            raise SrsPipelineStageError(
                "requirement_classification",
                InvalidLlmSrsOutputError("Requirement extraction produced no requirements"),
            )
        classified = with_branch_db(
            "requirement_classification",
            lambda branch_db: classify_requirements(
                branch_db,
                workspace_id=state["workspace_id"],
                project_id=state["project_id"],
                generation_job_id=state["generation_job_id"],
                requirements=extracted,
            ),
        )
        return {"classified": classified}

    workflow = StateGraph(SrsGenerationGraphState)
    workflow.add_node("summary", summary_node)
    workflow.add_node("requirement_extraction", extraction_node)
    workflow.add_node("requirement_classification", classification_node)
    workflow.add_edge(START, "summary")
    workflow.add_edge(START, "requirement_extraction")
    workflow.add_edge("summary", END)
    workflow.add_edge("requirement_extraction", "requirement_classification")
    workflow.add_edge("requirement_classification", END)

    invoke_config = {"max_concurrency": 1} if db.get_bind().dialect.name == "sqlite" else None
    result = workflow.compile().invoke(
        {
            "workspace_id": workspace_id,
            "project_id": project_id,
            "generation_job_id": generation_job_id,
            "raw_text": raw_text,
        },
        config=invoke_config,
    )
    summary = result.get("summary")
    extracted = result.get("extracted")
    classified = result.get("classified")
    if not isinstance(summary, dict) or not extracted or not classified:
        raise SrsPipelineStageError(
            "srs_graph",
            InvalidLlmSrsOutputError("LangGraph SRS pipeline did not produce all required outputs"),
        )
    return summary, extracted, classified


def _sync_srs_prompt_templates(db: Session) -> None:
    get_or_create_prompt_template(
        db,
        name="srs_summary_sections",
        purpose="summary",
        template_text=SRS_SUMMARY_PROMPT_TEMPLATE,
    )
    get_or_create_prompt_template(
        db,
        name="srs_requirement_extraction",
        purpose="requirement_extraction",
        template_text=SRS_REQUIREMENT_EXTRACTION_PROMPT_TEMPLATE,
    )
    get_or_create_prompt_template(
        db,
        name="srs_requirement_classification",
        purpose="requirement_classification",
        template_text=SRS_REQUIREMENT_CLASSIFICATION_PROMPT_TEMPLATE,
    )


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
    title: str | None = None,
    raw_text: str | None = None,
    requirement_input_id: UUID | None = None,
    generate_class_diagram: bool,
    diagram_methods: list[str],
) -> tuple[RequirementInput, GenerationJob, SrsDocument, list[Diagram]]:
    require_workspace_role(membership, allowed_roles=GENERATION_MUTATION_ROLES)
    _ensure_project_access(db, membership=membership, project_id=project_id)
    record_feature_usage(db, workspace_id=membership.workspace_id, feature="srs_generation")

    normalized_methods = _normalize_diagram_methods(diagram_methods)
    if generate_class_diagram and not normalized_methods:
        normalized_methods = ["rule_based"]

    if requirement_input_id is not None:
        requirement_input = _get_requirement_input(
            db, membership=membership, project_id=project_id, requirement_input_id=requirement_input_id
        )
    else:
        if title is None or raw_text is None:
            raise InvalidSrsRequestError("Either requirement_input_id or both title and raw_text are required")
        requirement_input = RequirementInput(
            workspace_id=membership.workspace_id,
            project_id=project_id,
            title=_clean_required(title, "Requirement title is required"),
            raw_text=_clean_required(raw_text, "Requirement text is required"),
            clarification_status=CLARIFICATION_NOT_REQUIRED,
            clarifying_questions=[],
            clarification_answers=[],
            refined_text=None,
            refinement_metadata=None,
            created_by_user_id=membership.user_id,
        )
        db.add(requirement_input)
        db.flush()

    source_text = requirement_input.refined_text or requirement_input.raw_text
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

    current_stage = "summary_and_requirement_extraction"
    try:
        summary, extracted, classified = _run_srs_llm_graph(
            db,
            workspace_id=membership.workspace_id,
            project_id=project_id,
            generation_job_id=generation_job.id,
            raw_text=source_text,
        )
        generation_job.progress_percent = 70
        db.commit()

        markdown, content_json = build_srs_document(requirement_input.title, summary, classified)
        content_json["generation_metadata"] = _generation_metadata(
            db,
            workspace_id=membership.workspace_id,
            project_id=project_id,
            generation_job_id=generation_job.id,
        )
        content_json["requirement_source"] = {
            "requirement_input_id": str(requirement_input.id),
            "used_refined_text": bool(requirement_input.refined_text),
        }

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
    except (InvalidSrsRequestError, LlmExecutionError) as exc:
        failed_stage = exc.stage if isinstance(exc, SrsPipelineStageError) else current_stage
        generation_job.status = "failed"
        generation_job.completed_at = datetime.now(UTC)
        generation_job.error_message = str(exc)
        generation_job.result_payload = {
            "failed_stage": failed_stage,
            "requirement_input_id": str(requirement_input.id),
            "used_refined_text": bool(requirement_input.refined_text),
        }
        db.commit()
        raise InvalidSrsRequestError(f"SRS generation failed during {failed_stage}: {exc}") from exc
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
        "used_refined_text": bool(requirement_input.refined_text),
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
