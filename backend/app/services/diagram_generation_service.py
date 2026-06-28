import html
import json
import re
from dataclasses import dataclass
from typing import Protocol
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    Diagram,
    DiagramRequirementLink,
    DiagramVersion,
    ExtractedRequirement,
    RequirementInput,
    SrsDocument,
    WorkspaceMember,
)
from app.services.billing_service import record_feature_usage
from app.services.llm_service import execute_llm_call, get_or_create_prompt_template
from app.services.project_service import ProjectNotFoundError, get_active_project
from app.services.workspace_service import require_workspace_role

DIAGRAM_GENERATION_ROLES = {"owner", "admin", "member"}
SUPPORTED_METHODS = {"llm", "rule_based"}
ENTITY_STOPWORDS = {
    "The",
    "System",
    "Users",
    "User",
    "Admins",
    "Admin",
    "Managers",
    "Manager",
    "Claims",
    "Requirements",
    "Requirement",
}


class DiagramGenerationError(Exception):
    """Base class for expected diagram generation failures."""


class InvalidDiagramGenerationRequestError(DiagramGenerationError):
    pass


class DiagramGenerationSourceNotFoundError(DiagramGenerationError):
    pass


@dataclass(frozen=True)
class DiagramClass:
    name: str
    attributes: list[str]
    methods: list[str]


@dataclass(frozen=True)
class DiagramRelationship:
    source: str
    target: str
    label: str


@dataclass(frozen=True)
class ClassDiagramModel:
    classes: list[DiagramClass]
    relationships: list[DiagramRelationship]


@dataclass(frozen=True)
class ClassDiagramContext:
    title: str
    requirements: list[str]
    source_id: UUID
    source_type: str


class ClassDiagramGenerator(Protocol):
    method: str

    def generate(
        self, db: Session, *, workspace_id: UUID, project_id: UUID, context: ClassDiagramContext
    ) -> ClassDiagramModel:
        """Generate a normalized class diagram model."""


def _ensure_project_access(db: Session, *, membership: WorkspaceMember, project_id: UUID) -> None:
    try:
        get_active_project(db, workspace_id=membership.workspace_id, project_id=project_id)
    except ProjectNotFoundError as exc:
        raise DiagramGenerationSourceNotFoundError("Project not found") from exc


def normalize_methods(methods: list[str]) -> list[str]:
    normalized = []
    for method in methods:
        cleaned = method.strip().lower()
        if cleaned == "both":
            for expanded in ["llm", "rule_based"]:
                if expanded not in normalized:
                    normalized.append(expanded)
            continue
        if cleaned not in SUPPORTED_METHODS:
            raise InvalidDiagramGenerationRequestError("Invalid diagram generation method")
        if cleaned not in normalized:
            normalized.append(cleaned)
    return normalized or ["rule_based"]


def _candidate_entities(text: str) -> list[str]:
    entities = []
    for word in re.findall(r"[A-Za-z][A-Za-z0-9_-]*", text):
        normalized = word.strip("_-.,;:").title()
        if len(normalized) < 4 or normalized in ENTITY_STOPWORDS:
            continue
        if normalized.endswith("s") and len(normalized) > 4:
            normalized = normalized[:-1]
        if normalized not in entities:
            entities.append(normalized)
        if len(entities) == 8:
            break
    return entities


def _element_id(label: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")
    return f"class:{slug or 'requirement'}"


def build_class_diagram_context(
    db: Session,
    *,
    membership: WorkspaceMember,
    project_id: UUID,
    requirement_input_id: UUID | None,
    srs_document_id: UUID | None,
) -> ClassDiagramContext:
    _ensure_project_access(db, membership=membership, project_id=project_id)
    if srs_document_id is None and requirement_input_id is None:
        raise InvalidDiagramGenerationRequestError("SRS document or requirement input is required")

    if srs_document_id is not None:
        document = db.scalar(
            select(SrsDocument).where(
                SrsDocument.id == srs_document_id,
                SrsDocument.workspace_id == membership.workspace_id,
                SrsDocument.project_id == project_id,
            )
        )
        if document is None:
            raise DiagramGenerationSourceNotFoundError("SRS document not found")
        extracted = list(
            db.scalars(
                select(ExtractedRequirement)
                .where(
                    ExtractedRequirement.workspace_id == membership.workspace_id,
                    ExtractedRequirement.project_id == project_id,
                    ExtractedRequirement.srs_document_id == document.id,
                )
                .order_by(ExtractedRequirement.requirement_code.asc())
            )
        )
        return ClassDiagramContext(
            title=f"{document.title} Class Diagram",
            requirements=[item.requirement_text for item in extracted] or [document.content_markdown],
            source_id=document.id,
            source_type="srs_document",
        )

    requirement_input = db.scalar(
        select(RequirementInput).where(
            RequirementInput.id == requirement_input_id,
            RequirementInput.workspace_id == membership.workspace_id,
            RequirementInput.project_id == project_id,
        )
    )
    if requirement_input is None:
        raise DiagramGenerationSourceNotFoundError("Requirement input not found")
    return ClassDiagramContext(
        title=f"{requirement_input.title} Class Diagram",
        requirements=[requirement_input.raw_text],
        source_id=requirement_input.id,
        source_type="requirement_input",
    )


class RuleBasedClassDiagramGenerator:
    method = "rule_based"

    def generate(
        self, db: Session, *, workspace_id: UUID, project_id: UUID, context: ClassDiagramContext
    ) -> ClassDiagramModel:
        del db, workspace_id, project_id
        entities = []
        for requirement in context.requirements:
            for entity in _candidate_entities(requirement):
                if entity not in entities:
                    entities.append(entity)
        if not entities:
            entities = ["Requirement", "System"]
        classes = [
            DiagramClass(
                name=entity,
                attributes=["id", "status"] if index == 0 else ["id"],
                methods=["create()", "update()"] if index == 0 else ["validate()"],
            )
            for index, entity in enumerate(entities[:6])
        ]
        relationships = [
            DiagramRelationship(source=classes[index].name, target=classes[index + 1].name, label="uses")
            for index in range(len(classes) - 1)
        ]
        return ClassDiagramModel(classes=classes, relationships=relationships)


class LlmClassDiagramGenerator:
    method = "llm"

    def generate(
        self, db: Session, *, workspace_id: UUID, project_id: UUID, context: ClassDiagramContext
    ) -> ClassDiagramModel:
        template = get_or_create_prompt_template(
            db,
            name="class_diagram_generation",
            purpose="class_diagram",
            template_text="Generate class diagram entities from requirements: {requirements}",
        )
        execute_llm_call(
            db,
            workspace_id=workspace_id,
            project_id=project_id,
            generation_job_id=None,
            template=template,
            variables={"requirements": "\n".join(context.requirements)},
        )
        return RuleBasedClassDiagramGenerator().generate(
            db, workspace_id=workspace_id, project_id=project_id, context=context
        )


class DiagramGeneratorRegistry:
    def __init__(self) -> None:
        self._generators: dict[str, ClassDiagramGenerator] = {}

    def register(self, generator: ClassDiagramGenerator) -> None:
        self._generators[generator.method] = generator

    def get(self, method: str) -> ClassDiagramGenerator:
        generator = self._generators.get(method)
        if generator is None:
            raise InvalidDiagramGenerationRequestError("Diagram generator not found")
        return generator


def default_generator_registry() -> DiagramGeneratorRegistry:
    registry = DiagramGeneratorRegistry()
    registry.register(RuleBasedClassDiagramGenerator())
    registry.register(LlmClassDiagramGenerator())
    return registry


def merge_diagram_models(models: list[ClassDiagramModel]) -> ClassDiagramModel:
    classes_by_name: dict[str, DiagramClass] = {}
    relationships = []
    for model in models:
        for diagram_class in model.classes:
            classes_by_name.setdefault(diagram_class.name, diagram_class)
        for relationship in model.relationships:
            if relationship not in relationships:
                relationships.append(relationship)
    return ClassDiagramModel(classes=list(classes_by_name.values()), relationships=relationships)


def build_drawio_xml(model: ClassDiagramModel) -> str:
    cells = [
        '<mxCell id="0"/>',
        '<mxCell id="1" parent="0"/>',
    ]
    class_ids: dict[str, str] = {}
    for index, diagram_class in enumerate(model.classes, start=2):
        cell_id = str(index)
        class_ids[diagram_class.name] = cell_id
        attributes = "\n".join(diagram_class.attributes)
        methods = "\n".join(diagram_class.methods)
        value = html.escape(f"{diagram_class.name}\n--\n{attributes}\n--\n{methods}")
        x = 40 + ((index - 2) % 3) * 220
        y = 40 + ((index - 2) // 3) * 150
        cells.append(
            f'<mxCell id="{cell_id}" value="{value}" style="rounded=0;whiteSpace=wrap;html=1;" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="160" height="100" as="geometry"/>'
            '</mxCell>'
        )
    edge_id = len(model.classes) + 2
    for relationship in model.relationships:
        source = class_ids.get(relationship.source)
        target = class_ids.get(relationship.target)
        if source is None or target is None:
            continue
        value = html.escape(relationship.label)
        cells.append(
            f'<mxCell id="{edge_id}" value="{value}" style="endArrow=block;html=1;rounded=0;" edge="1" parent="1" source="{source}" target="{target}">'
            '<mxGeometry relative="1" as="geometry"/>'
            '</mxCell>'
        )
        edge_id += 1
    return (
        '<mxfile><diagram name="Class Diagram"><mxGraphModel><root>'
        + "".join(cells)
        + '</root></mxGraphModel></diagram></mxfile>'
    )


def _load_extracted_requirements_for_srs(
    db: Session, *, workspace_id: UUID, project_id: UUID, srs_document_id: UUID | None
) -> list[ExtractedRequirement]:
    if srs_document_id is None:
        return []
    return list(
        db.scalars(
            select(ExtractedRequirement)
            .where(
                ExtractedRequirement.workspace_id == workspace_id,
                ExtractedRequirement.project_id == project_id,
                ExtractedRequirement.srs_document_id == srs_document_id,
            )
            .order_by(ExtractedRequirement.requirement_code.asc())
        )
    )


def _best_class_for_requirement(requirement: ExtractedRequirement, model: ClassDiagramModel) -> DiagramClass | None:
    if not model.classes:
        return None
    text = requirement.requirement_text.lower()
    for diagram_class in model.classes:
        if diagram_class.name.lower() in text:
            return diagram_class
    candidates = _candidate_entities(requirement.requirement_text)
    for candidate in candidates:
        for diagram_class in model.classes:
            if diagram_class.name.lower() == candidate.lower():
                return diagram_class
    return model.classes[0]


def _build_traceability_payload(
    requirements: list[ExtractedRequirement], model: ClassDiagramModel
) -> list[dict[str, str | float]]:
    payload = []
    for requirement in requirements:
        diagram_class = _best_class_for_requirement(requirement, model)
        if diagram_class is None:
            continue
        payload.append(
            {
                "requirement_code": requirement.requirement_code,
                "diagram_element_id": _element_id(diagram_class.name),
                "diagram_element_label": diagram_class.name,
                "confidence_score": 0.78,
            }
        )
    return payload


def _create_requirement_links(
    db: Session,
    *,
    workspace_id: UUID,
    project_id: UUID,
    diagram: Diagram,
    version: DiagramVersion,
    srs_document_id: UUID | None,
    requirements: list[ExtractedRequirement],
    model: ClassDiagramModel,
) -> None:
    if srs_document_id is None:
        return
    for requirement in requirements:
        diagram_class = _best_class_for_requirement(requirement, model)
        if diagram_class is None:
            continue
        db.add(
            DiagramRequirementLink(
                workspace_id=workspace_id,
                project_id=project_id,
                diagram_id=diagram.id,
                diagram_version_id=version.id,
                srs_document_id=srs_document_id,
                extracted_requirement_id=requirement.id,
                requirement_code=requirement.requirement_code,
                diagram_element_id=_element_id(diagram_class.name),
                diagram_element_label=diagram_class.name,
                link_reason="Requirement text matched the generated class diagram element.",
                confidence_score=0.78,
            )
        )


def generate_class_diagram(
    db: Session,
    *,
    membership: WorkspaceMember,
    project_id: UUID,
    requirement_input_id: UUID | None,
    srs_document_id: UUID | None,
    methods: list[str],
) -> Diagram:
    require_workspace_role(membership, allowed_roles=DIAGRAM_GENERATION_ROLES)
    normalized_methods = normalize_methods(methods)
    if "llm" in normalized_methods:
        record_feature_usage(db, workspace_id=membership.workspace_id, feature="ai_diagram_generation")
    context = build_class_diagram_context(
        db,
        membership=membership,
        project_id=project_id,
        requirement_input_id=requirement_input_id,
        srs_document_id=srs_document_id,
    )
    registry = default_generator_registry()
    models = [
        registry.get(method).generate(
            db,
            workspace_id=membership.workspace_id,
            project_id=project_id,
            context=context,
        )
        for method in normalized_methods
    ]
    merged = merge_diagram_models(models)
    requirements = _load_extracted_requirements_for_srs(
        db,
        workspace_id=membership.workspace_id,
        project_id=project_id,
        srs_document_id=srs_document_id,
    )
    drawio_xml = build_drawio_xml(merged)
    diagram_json = {
        "source_type": context.source_type,
        "source_id": str(context.source_id),
        "methods": normalized_methods,
        "classes": [diagram_class.__dict__ for diagram_class in merged.classes],
        "relationships": [relationship.__dict__ for relationship in merged.relationships],
        "traceability": _build_traceability_payload(requirements, merged),
        "generation_metadata": {
            "generation_methods": normalized_methods,
            "model_name": "deterministic-srs-v1" if "llm" in normalized_methods else None,
            "source_type": context.source_type,
            "source_id": str(context.source_id),
        },
    }

    diagram = Diagram(
        workspace_id=membership.workspace_id,
        project_id=project_id,
        title=context.title,
        diagram_type="class",
        source="generated",
        status="active",
        current_version=1,
        created_by_user_id=membership.user_id,
    )
    db.add(diagram)
    db.flush()
    version = DiagramVersion(
        workspace_id=membership.workspace_id,
        project_id=project_id,
        diagram_id=diagram.id,
        version_number=1,
        drawio_xml=drawio_xml,
        diagram_json=json.dumps(diagram_json),
        created_by_user_id=membership.user_id,
    )
    db.add(version)
    db.flush()
    _create_requirement_links(
        db,
        workspace_id=membership.workspace_id,
        project_id=project_id,
        diagram=diagram,
        version=version,
        srs_document_id=srs_document_id,
        requirements=requirements,
        model=merged,
    )
    db.commit()
    db.refresh(diagram)
    return diagram