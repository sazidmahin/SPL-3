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
from app.services.llm_service import (
    configured_llm_model_name,
    execute_llm_call,
    get_or_create_prompt_template,
)
from app.services.project_service import ProjectNotFoundError, get_active_project
from app.services.workspace_service import require_workspace_role
from app.rule_engine.dictionaries import load_dictionaries
from app.rule_engine.pipeline import analyze_text, generate_drawio_xml, normalize_relationship_type

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
    "activate",
    "add",
    "approve",
    "archive",
    "assign",
    "authenticate",
    "authorize",
    "borrow",
    "calculate",
    "cancel",
    "capture",
    "change",
    "check",
    "classify",
    "configure",
    "create",
    "deactivate",
    "delete",
    "deliver",
    "deploy",
    "deposit",
    "disable",
    "dispatch",
    "download",
    "duplicate",
    "edit",
    "enable",
    "escalate",
    "export",
    "extract",
    "generate",
    "import",
    "invite",
    "list",
    "load",
    "login",
    "logout",
    "manage",
    "migrate",
    "notify",
    "open",
    "pay",
    "persist",
    "publish",
    "purchase",
    "read",
    "reconcile",
    "redeem",
    "register",
    "reject",
    "remove",
    "renew",
    "render",
    "reserve",
    "resolve",
    "respond",
    "review",
    "save",
    "select",
    "send",
    "share",
    "show",
    "store",
    "submit",
    "subscribe",
    "switch",
    "synchronize",
    "track",
    "transfer",
    "unsubscribe",
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
ATTRIBUTE_OWNERSHIP_PATTERN = re.compile(
    r"^(?:(?:a|an|the)\s+)?(?P<owner>[A-Za-z][A-Za-z0-9_-]*)\s+"
    r"(?:has|have|includes?|stores?|records?)\s+(?P<attributes>.+?)[.!?]*$",
    flags=re.IGNORECASE,
)
ATTRIBUTE_LIST_PREFIX = re.compile(r"^(?:the\s+)?(?:following\s+)?(?:attributes?|fields?|details?)\s*(?:are|:)?\s*", re.IGNORECASE)
ATTRIBUTE_RELATIONSHIP_ACTIONS = {
    "has", "have", "having", "had", "include", "includes", "including",
    "store", "stores", "record", "records", "contain", "contains", "with",
}


def _is_attribute_relationship_action(raw_action: str) -> bool:
    # "has a" / "has many" / "with the following" all count as possessive.
    first = raw_action.strip().lower().split(" ", 1)[0]
    return first in ATTRIBUTE_RELATIONSHIP_ACTIONS

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
    type: str = "association"
    source_multiplicity: str | None = "1"
    target_multiplicity: str | None = "0..*"
    direction: str = "source-to-target"

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
    dictionaries = load_dictionaries()
    generic_nouns = {item.lower() for item in dictionaries.get("generic_nouns", [])}
    primitive_attributes = {item.lower() for item in dictionaries.get("primitive_attributes", [])}
    if (
        len(normalized) < 3
        or normalized in ENTITY_STOPWORDS
        or normalized in generic_nouns
        or normalized in primitive_attributes
        or _normalize_action(normalized)
    ):
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


def _attribute_name_from_phrase(phrase: str) -> str | None:
    words = re.findall(r"[A-Za-z][A-Za-z0-9_-]*", phrase)
    if not words:
        return None
    first, *rest = words
    return first.lower() + "".join(word[:1].upper() + word[1:].lower() for word in rest)


def _normalize_attribute_phrase(phrase: str) -> str:
    normalized = re.sub(r"\s+", " ", phrase.strip().lower())
    return re.sub(r"^(?:a|an|the|unique|required|optional)\s+", "", normalized)


def _attribute_definition(attribute_phrase: str) -> tuple[str | None, str]:
    phrase_key = _normalize_attribute_phrase(attribute_phrase)
    definition = load_dictionaries().get("attribute_phrases", {}).get(phrase_key)
    if isinstance(definition, dict):
        name = definition.get("name")
        attribute_type = definition.get("type")
        if isinstance(name, str) and isinstance(attribute_type, str):
            return name, attribute_type

    hints = {key.lower(): value for key, value in load_dictionaries().get("data_type_hints", {}).items()}
    words = [word.lower() for word in re.findall(r"[A-Za-z][A-Za-z0-9_-]*", attribute_phrase)]
    for word in reversed(words):
        if word in hints:
            return _attribute_name_from_phrase(attribute_phrase), str(hints[word])
    attribute_name = _attribute_name_from_phrase(attribute_phrase) or ""
    if attribute_name.startswith(("is", "has", "can", "should")):
        return attribute_name, "Boolean"
    return attribute_name or None, "String"


def _extract_rule_based_attributes(requirements: list[str]) -> tuple[dict[str, list[str]], set[str]]:
    """Extract explicit primitive fields, leaving domain-object relations as relationships."""
    primitive_attributes = {
        item.lower() for item in load_dictionaries().get("primitive_attributes", [])
    }
    attributes_by_class: dict[str, list[str]] = {}
    attribute_only_requirements: set[str] = set()
    for requirement in requirements:
        match = ATTRIBUTE_OWNERSHIP_PATTERN.match(requirement.strip())
        if not match:
            continue
        owner = _class_name_from_token(match.group("owner"))
        if owner is None:
            continue
        raw_attributes = ATTRIBUTE_LIST_PREFIX.sub("", match.group("attributes").strip())
        phrases = [
            phrase.strip(" .")
            for phrase in re.split(r"\s*,\s*|\s+and\s+", raw_attributes, flags=re.IGNORECASE)
            if phrase.strip(" .")
        ]
        accepted_count = 0
        is_field_list = bool(re.search(r"\b(?:attributes?|fields?|details?)\b", match.group("attributes"), re.IGNORECASE))
        for phrase in phrases:
            words = [word.lower() for word in re.findall(r"[A-Za-z][A-Za-z0-9_-]*", phrase)]
            # A bare domain noun (for example, "User has Account") remains a relationship.
            # A field is accepted if it explicitly names a known primitive/type hint, or is in a field list.
            if not is_field_list and not any(word in primitive_attributes for word in words):
                continue
            attribute_name, attribute_type = _attribute_definition(phrase)
            if attribute_name is None:
                continue
            accepted_count += 1
            attribute = f"{attribute_name}: {attribute_type}"
            attributes_by_class.setdefault(owner, [])
            if attribute not in attributes_by_class[owner]:
                attributes_by_class[owner].append(attribute)
        if phrases and accepted_count == len(phrases):
            attribute_only_requirements.add(requirement.strip().lower())
    return attributes_by_class, attribute_only_requirements

def _extract_rule_based_model(requirements: list[str]) -> ClassDiagramModel:
    class_names: list[str] = []
    methods_by_class: dict[str, list[str]] = {}
    relationships: list[DiagramRelationship] = []
    attributes_by_class, attribute_only_requirements = _extract_rule_based_attributes(requirements)

    for requirement in requirements:
        typed_facts = [
            fact
            for fact in analyze_text(requirement).get("facts", [])
            if normalize_relationship_type(fact.get("relationshipType")) is not None
        ]
        if typed_facts:
            for fact in typed_facts:
                source = fact.get("actor")
                target = fact.get("object")
                relationship_type = normalize_relationship_type(fact.get("relationshipType"))
                if not source or not target or not relationship_type or source == target:
                    continue
                raw_action = str(fact.get("rawAction") or fact.get("action") or "").lower()
                if requirement.strip().lower() in attribute_only_requirements and _is_attribute_relationship_action(raw_action):
                    if source not in class_names:
                        class_names.append(source)
                    methods_by_class.setdefault(source, [])
                    continue
                for class_name in (source, target):
                    if class_name not in class_names:
                        class_names.append(class_name)
                    methods_by_class.setdefault(class_name, [])
                action = str(fact.get("action") or fact.get("rawAction") or relationship_type)
                method = _method_name(action, target)
                if method not in methods_by_class[source]:
                    methods_by_class[source].append(method)
                relationship = DiagramRelationship(
                    source=source,
                    target=target,
                    label=action,
                    type=relationship_type,
                    source_multiplicity=fact.get("sourceMultiplicity"),
                    target_multiplicity=fact.get("targetMultiplicity"),
                    direction="source-to-target",
                )
                if relationship not in relationships:
                    relationships.append(relationship)
            continue
        tokens = [
            (match.start(), match.group(0), _class_name_from_token(match.group(0)), _normalize_action(match.group(0)))
            for match in re.finditer(r"[A-Za-z][A-Za-z0-9_-]*", requirement)
        ]
        sentence_classes = [(position, class_name) for position, _, class_name, _ in tokens if class_name]
        sentence_actions = [(position, action) for position, _, _, action in tokens if action]

        def _register(class_name: str | None) -> None:
            if not class_name:
                return
            if class_name not in class_names:
                class_names.append(class_name)
            methods_by_class.setdefault(class_name, [])

        # A noun only earns a class when it actually plays a role: the subject or
        # target of an action, or the owner of explicit attributes. A noun that
        # is merely name-dropped in a sentence is left out.
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
            _register(owner)
            _register(target)
            if owner is not None:
                method = _method_name(action, target)
                if method not in methods_by_class[owner]:
                    methods_by_class[owner].append(method)
            if subject and target and subject != target:
                _register(subject)
                relationship = DiagramRelationship(source=subject, target=target, label=action)
                if relationship not in relationships:
                    relationships.append(relationship)

        for _, class_name in sentence_classes:
            if class_name in attributes_by_class:
                _register(class_name)

    if not class_names:
        return ClassDiagramModel(
            classes=[DiagramClass(name="Requirement", attributes=[], methods=["validate()"])],
            relationships=[],
        )

    # Drop any candidate that ended up with no method, no attribute and no edge —
    # it never proved it was a class.
    surviving = [
        class_name
        for class_name in class_names[:8]
        if methods_by_class.get(class_name)
        or attributes_by_class.get(class_name)
        or any(rel.source == class_name or rel.target == class_name for rel in relationships)
    ]
    if not surviving:
        surviving = class_names[:1]
    classes = [
        DiagramClass(
            name=class_name,
            attributes=attributes_by_class.get(class_name, []),
            methods=methods_by_class.get(class_name, []),
        )
        for class_name in surviving
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
    class_ids = {diagram_class.name: _element_id(diagram_class.name) for diagram_class in model.classes}
    canonical_model = {
        "classes": [
            {
                "id": class_ids[diagram_class.name],
                "name": diagram_class.name,
                "attributes": [
                    {
                        "id": f"attribute_{index}",
                        "name": attribute.split(":", 1)[0].strip(),
                        "type": attribute.split(":", 1)[1].strip() if ":" in attribute else "String",
                    }
                    for index, attribute in enumerate(diagram_class.attributes, start=1)
                ],
                "methods": [
                    {
                        "id": f"method_{index}",
                        "name": method.split("(", 1)[0].strip(),
                        "parameters": [],
                        "returnType": "void",
                    }
                    for index, method in enumerate(diagram_class.methods, start=1)
                ],
                "enabled": True,
            }
            for diagram_class in model.classes
        ],
        "relationships": [
            {
                "id": f"edge_{index:03d}",
                "sourceClassId": class_ids[relationship.source],
                "targetClassId": class_ids[relationship.target],
                "type": relationship.type,
                "label": relationship.label,
                "sourceMultiplicity": relationship.source_multiplicity,
                "targetMultiplicity": relationship.target_multiplicity,
                "direction": relationship.direction,
                "enabled": True,
            }
            for index, relationship in enumerate(model.relationships, start=1)
            if relationship.source in class_ids and relationship.target in class_ids
        ],
    }
    xml_text, validation = generate_drawio_xml(canonical_model)
    if not validation["valid"]:
        raise InvalidDiagramGenerationRequestError("; ".join(validation["errors"]))
    return xml_text

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
            "model_name": configured_llm_model_name() if "llm" in normalized_methods else None,
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
