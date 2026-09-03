from uuid import uuid4

from app.services.diagram_generation_service import (
    ClassDiagramContext,
    ClassDiagramModel,
    DiagramClass,
    DiagramRelationship,
    RuleBasedClassDiagramGenerator,
    build_drawio_xml,
    default_generator_registry,
    merge_diagram_models,
    normalize_methods,
)


def test_registry_and_rule_based_generator_create_drawio_xml() -> None:
    registry = default_generator_registry()
    context = ClassDiagramContext(
        title="Claims Class Diagram",
        requirements=[
            "The system shall support users submit claims",
            "The system shall support admins approve claims",
        ],
        source_id=uuid4(),
        source_type="srs_document",
    )

    model = registry.get("rule_based").generate(
        None, workspace_id=uuid4(), project_id=uuid4(), context=context
    )
    xml = build_drawio_xml(model)
    classes = {diagram_class.name: diagram_class for diagram_class in model.classes}
    relationships = {(relationship.source, relationship.target, relationship.label) for relationship in model.relationships}

    assert {"User", "Admin", "Claim"}.issubset(classes)
    assert "Support" not in classes
    assert "submitClaim()" in classes["User"].methods
    assert "approveClaim()" in classes["Admin"].methods
    assert ("User", "Claim", "submit") in relationships
    assert ("Admin", "Claim", "approve") in relationships
    assert xml.startswith("<mxfile")
    assert "mxCell" in xml


def test_method_normalization_and_model_merge() -> None:
    assert normalize_methods(["both", "rule_based"]) == ["llm", "rule_based"]

    context = ClassDiagramContext(
        title="Claims Class Diagram",
        requirements=["Customers submit claims and admins review claims"],
        source_id=uuid4(),
        source_type="srs_document",
    )
    first = RuleBasedClassDiagramGenerator().generate(
        None, workspace_id=uuid4(), project_id=uuid4(), context=context
    )
    second = RuleBasedClassDiagramGenerator().generate(
        None, workspace_id=uuid4(), project_id=uuid4(), context=context
    )

    merged = merge_diagram_models([first, second])
    assert len(merged.classes) == len(first.classes)


def test_rule_based_generator_extracts_explicit_attributes_and_types() -> None:
    context = ClassDiagramContext(
        title="Claims Class Diagram",
        requirements=[
            "A claim has claim number, amount, submission date and status.",
            "A user has name, email and password.",
        ],
        source_id=uuid4(),
        source_type="srs_document",
    )

    model = RuleBasedClassDiagramGenerator().generate(
        None, workspace_id=uuid4(), project_id=uuid4(), context=context
    )
    classes = {diagram_class.name: diagram_class for diagram_class in model.classes}

    assert classes["Claim"].attributes == [
        "claimNumber: String",
        "amount: Decimal",
        "submissionDate: Date",
        "status: String",
    ]
    assert classes["User"].attributes == [
        "name: String",
        "email: String",
        "password: String",
    ]


def test_rule_based_attribute_extraction_keeps_domain_nouns_as_relationships() -> None:
    context = ClassDiagramContext(
        title="Accounts Class Diagram",
        requirements=["A user has an account."],
        source_id=uuid4(),
        source_type="srs_document",
    )

    model = RuleBasedClassDiagramGenerator().generate(
        None, workspace_id=uuid4(), project_id=uuid4(), context=context
    )
    classes = {diagram_class.name: diagram_class for diagram_class in model.classes}

    assert classes["User"].attributes == ["id", "status"]
    assert "Account" in classes


def test_rule_based_generator_uses_multi_word_attribute_dictionary() -> None:
    context = ClassDiagramContext(
        title="Customer Class Diagram",
        requirements=[
            "A customer has the following fields: date of birth, phone number, postal code and is active.",
        ],
        source_id=uuid4(),
        source_type="srs_document",
    )

    model = RuleBasedClassDiagramGenerator().generate(
        None, workspace_id=uuid4(), project_id=uuid4(), context=context
    )
    classes = {diagram_class.name: diagram_class for diagram_class in model.classes}

    assert set(classes) == {"Customer"}
    assert classes["Customer"].attributes == [
        "dateOfBirth: Date",
        "phoneNumber: String",
        "postalCode: String",
        "isActive: Boolean",
    ]


def test_legacy_drawio_builder_uses_canonical_relationship_renderer() -> None:
    model = ClassDiagramModel(
        classes=[
            DiagramClass(name="SavingsAccount", attributes=["id"], methods=[]),
            DiagramClass(name="Account", attributes=["id"], methods=[]),
        ],
        relationships=[
            DiagramRelationship(
                source="SavingsAccount",
                target="Account",
                label="extends",
                type="inheritance",
                direction="source-to-target",
            )
        ],
    )

    xml = build_drawio_xml(model)

    assert "endArrow=block" in xml
    assert "endFill=0" in xml
