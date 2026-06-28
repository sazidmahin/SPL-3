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
    "a",
    "an",
    "and",
    "be",
    "by",
    "for",
    "from",
    "if",
    "in",
    "into",
    "it",
    "of",
    "on",
    "or",
    "shall",
    "should",
    "system",
    "support",
    "supports",
    "must",
    "can",
    "allow",
    "allows",
    "that",
    "the",
    "their",
    "this",
    "to",
    "two",
    "within",
    "second",
    "seconds",
    "requirement",
    "requirements",
}
ACTION_VERBS = {
    "add",
    "approve",
    "archive",
    "assign",
    "authenticate",
    "calculate",
    "cancel",
    "capture",
    "change",
    "check",
    "classify",
    "create",
    "delete",
    "download",
    "edit",
    "export",
    "extract",
    "generate",
    "import",
    "invite",
    "list",
    "load",
    "login",
    "manage",
    "notify",
    "open",
    "pay",
    "persist",
    "publish",
    "read",
    "register",
    "reject",
    "remove",
    "render",
    "respond",
    "review",
    "save",
    "select",
    "send",
    "show",
    "store",
    "submit",
    "switch",
    "track",
    "update",
    "upload",
    "validate",
    "verify",
    "view",
}
IRREGULAR_NOUNS = {
    "people": "Person",
    "children": "Child",
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

def _class_name_from_token(token: str) -> str | None:
    normalized = token.strip("_-.,;:").lower()
    if len(normalized) < 3 or normalized in ENTITY_STOPWORDS or _normalize_action(normalized):
        return None
    if normalized in IRREGULAR_NOUNS:
        return IRREGULAR_NOUNS[normalized]
    if normalized.endswith("ies") and len(normalized) > 4:
        normalized = f"{normalized[:-3]}y"
    elif normalized.endswith(("ches", "shes", "sses", "xes", "zes")) and len(normalized) > 5:
        normalized = normalized[:-2]
    elif normalized.endswith("s") and not normalized.endswith("ss") and len(normalized) > 4:
        normalized = normalized[:-1]
    return "".join(part.capitalize() for part in re.split(r"[-_]", normalized) if part)

def _normalize_action(token: str) -> str | None:
    normalized = token.strip("_-.,;:").lower()
    candidates = [normalized]
    if normalized.endswith("ing") and len(normalized) > 5:
        stem = normalized[:-3]
        candidates.extend([stem, f"{stem}e"])
    if normalized.endswith("es") and len(normalized) > 4:
        candidates.append(normalized[:-2])
    if normalized.endswith("s") and len(normalized) > 3:
        candidates.append(normalized[:-1])
    return next((candidate for candidate in candidates if candidate in ACTION_VERBS), None)

def _method_name(action: str, target: str | None) -> str:
    if target:
        return f"{action}{target}()"
    return f"{action}()"

def _candidate_entities(text: str) -> list[str]:
    entities = []
    for word in re.findall(r"[A-Za-z][A-Za-z0-9_-]*", text):
        entity = _class_name_from_token(word)
        if entity and entity not in entities:
            entities.append(entity)
        if len(entities) == 8:
            break
    return entities

def _extract_rule_based_model(requirements: list[str]) -> ClassDiagramModel:
    class_names: list[str] = []
    methods_by_class: dict[str, list[str]] = {}
    relationships: list[DiagramRelationship] = []

    for requirement in requirements:
        tokens = [
            (match.start(), match.group(0), _class_name_from_token(match.group(0)), _normalize_action(match.group(0)))
            for match in re.finditer(r"[A-Za-z][A-Za-z0-9_-]*", requirement)
        ]
        sentence_classes = [(position, class_name) for position, _, class_name, _ in tokens if class_name]
        sentence_actions = [(position, action) for position, _, _, action in tokens if action]

        for _, class_name in sentence_classes:
            if class_name not in class_names:
                class_names.append(class_name)
            methods_by_class.setdefault(class_name, [])

        for action_position, action in sentence_actions:
            subject = next(
                (class_name for position, class_name in reversed(sentence_classes) if position < action_position),
                None,
            )
            target = next(
                (
                    class_name
                    for position, class_name in sentence_classes
                    if position > action_position and class_name != subject
                ),
                None,
            )
            owner = subject or (sentence_classes[0][1] if sentence_classes else None)
            if owner is not None:
                method = _method_name(action, target)
                if method not in methods_by_class.setdefault(owner, []):
                    methods_by_class[owner].append(method)
            if subject and target and subject != target:
                relationship = DiagramRelationship(source=subject, target=target, label=action)
                if relationship not in relationships:
                    relationships.append(relationship)

        if not sentence_actions and len(sentence_classes) >= 2:
            source = sentence_classes[0][1]
            target = sentence_classes[1][1]
            relationship = DiagramRelationship(source=source, target=target, label="relates to")
            if source != target and relationship not in relationships:
                relationships.append(relationship)

    if not class_names:
        class_names = ["Requirement"]
        methods_by_class = {"Requirement": ["validate()"]}

    classes = [
        DiagramClass(
            name=class_name,
            attributes=["id", "status"] if methods_by_class.get(class_name) else ["id"],
            methods=methods_by_class.get(class_name) or ["validate()"],
        )
        for class_name in class_names[:8]
    ]
    allowed_class_names = {diagram_class.name for diagram_class in classes}
    return ClassDiagramModel(
        classes=classes,
        relationships=[
            relationship
            for relationship in relationships
            if relationship.source in allowed_class_names and relationship.target in allowed_class_names
        ],
    )

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
        return _extract_rule_based_model(context.requirements)

class LlmClassDiagramGenerator:
    method = "llm"

    def generate(
        self, db: Session, *, workspace_id: UUID, project_id: UUID, context: ClassDiagramContext
    ) -> ClassDiagramModel:
        template = get_or_create_prompt_template(
            db,
            name="class_diagram_generation",
            purpose="class_diagram",
            template_text="Extract class diagram nouns, verbs, and relationships from requirements: {requirements}",
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
        "rule_based_extraction": {
            "classes": [diagram_class.name for diagram_class in merged.classes],
            "methods_by_class": {diagram_class.name: diagram_class.methods for diagram_class in merged.classes},
            "relationships": [relationship.__dict__ for relationship in merged.relationships],
        },
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