import xml.etree.ElementTree as ET

import pytest

from app.rule_engine.pipeline import (
    analyze_text,
    apply_answers,
    generate_class_model,
    generate_drawio_xml,
    generate_final_story,
    generate_requirements,
    validate_class_model,
)


def _flow(text: str):
    analysis = analyze_text(text)
    final_story = generate_final_story(text, analysis["sentences"], analysis["facts"], [])
    requirements = generate_requirements(final_story, analysis["facts"])["requirements"]
    class_model = generate_class_model(requirements, analysis["facts"])
    return analysis, final_story, requirements, class_model


def test_customer_create_order_generates_fr_classes_and_association() -> None:
    analysis, _, requirements, class_model = _flow("A customer can create an order.")

    fact = analysis["facts"][0]
    assert fact["actor"] == "Customer"
    assert fact["action"] == "create"
    assert fact["object"] == "Order"
    assert any(req["requirementId"] == "FR-001" for req in requirements)
    assert {cls["id"] for cls in class_model["classes"]} >= {"class_customer", "class_order"}
    assert class_model["relationships"][0]["type"] == "association"


def test_condition_and_pronoun_resolution_generate_conditional_fr() -> None:
    analysis, _, requirements, _ = _flow("If payment fails, the customer can retry it.")

    fact = analysis["facts"][0]
    assert fact["condition"] == {"subject": "Payment", "operator": "is", "value": "failed"}
    assert fact["actor"] == "Customer"
    assert fact["action"] == "retry"
    assert fact["object"] == "Payment"
    assert requirements[0]["statement"].startswith("If Payment failed")


def test_only_administrator_generates_business_rule_and_method() -> None:
    _, _, requirements, class_model = _flow("Only an administrator can delete a product.")

    assert any(req["requirementType"] == "business_rule" for req in requirements)
    assert {cls["id"] for cls in class_model["classes"]} >= {"class_administrator", "class_product"}
    admin = next(cls for cls in class_model["classes"] if cls["id"] == "class_administrator")
    assert any(method["id"] == "method_administrator_delete_product" for method in admin["methods"])


def test_order_contains_product_generates_composition_and_multiplicity() -> None:
    analysis, _, requirements, class_model = _flow("An order must contain at least one product.")

    fact = analysis["facts"][0]
    assert fact["sourceMultiplicity"] == "1"
    assert fact["targetMultiplicity"] == "1..*"
    assert any(req["requirementType"] == "business_rule" for req in requirements)
    relationship = class_model["relationships"][0]
    assert relationship["type"] == "composition"
    assert relationship["sourceMultiplicity"] == "1"
    assert relationship["targetMultiplicity"] == "1..*"


def test_performance_nfr_is_measurable() -> None:
    analysis, _, requirements, _ = _flow("The system must respond within three seconds.")

    fact = analysis["facts"][0]
    assert fact["nfr"]["category"] == "Performance"
    assert fact["nfr"]["measurable"] is True
    assert fact["nfr"]["targetValue"] == 3
    assert fact["nfr"]["unit"] == "seconds"
    assert requirements[0]["requirementType"] == "non_functional"


def test_passive_deleted_story_generates_missing_actor_question() -> None:
    analysis = analyze_text("Orders can be deleted.")

    fact = analysis["facts"][0]
    assert fact["actor"] is None
    assert "actor" in fact["missingFields"]
    assert analysis["clarificationQuestions"][0]["triggeredRuleId"] == "CLR_MISSING_ACTOR_001"


def test_unknown_entities_are_detected_positionally() -> None:
    analysis = analyze_text("A curator can archive a manuscript.")

    fact = analysis["facts"][0]
    assert fact["actor"] == "Curator"
    assert fact["action"] == "archive"
    assert fact["object"] == "Manuscript"


def test_xml_generation_is_byte_deterministic() -> None:
    _, _, _, class_model = _flow("A customer can create an order.")

    xml_one, validation_one = generate_drawio_xml(class_model)
    xml_two, validation_two = generate_drawio_xml(class_model)

    assert validation_one["valid"] is True
    assert validation_two["valid"] is True
    assert xml_one == xml_two
    assert "class_customer" in xml_one
    assert "edge_customer_create_order" in xml_one
    assert "swimlane" in xml_one
    assert "$id" not in xml_one

    parsed = ET.fromstring(xml_one)
    customer_cell = parsed.find(".//mxCell[@id='class_customer']")
    assert customer_cell is not None
    assert customer_cell.attrib["value"] == "Customer"
    assert customer_cell.attrib["vertex"] == "1"
    assert customer_cell.find("mxGeometry") is not None


def test_clarification_answer_slot_filling_is_deterministic() -> None:
    analysis = analyze_text("Orders can be deleted.")
    question = analysis["clarificationQuestions"][0]
    answers = [{"questionStableId": question["id"], "answerText": "Administrator", "status": "answered", "appliedSlot": "actor"}]
    merged = apply_answers(analysis["facts"], answers, {question["id"]: question})

    assert merged[0]["actor"] == "Administrator"
    assert "actor" not in merged[0]["missingFields"]


def test_clarification_answer_generates_class_diagram_entities() -> None:
    analysis = analyze_text("Orders can be deleted.")
    question = analysis["clarificationQuestions"][0]
    answers = [{"questionStableId": question["id"], "answerText": "Administrator", "status": "answered", "appliedSlot": "actor"}]
    merged = apply_answers(analysis["facts"], answers, {question["id"]: question})
    final_story = generate_final_story("Orders can be deleted.", analysis["sentences"], merged, answers)
    requirements = generate_requirements(final_story, analysis["facts"])["requirements"]
    class_model = generate_class_model(requirements, analysis["facts"])
    xml, validation = generate_drawio_xml(class_model)

    assert validation["valid"] is True
    assert {item["id"] for item in class_model["classes"]} >= {"class_administrator", "class_order"}
    assert "Administrator" in xml
    assert "Order" in xml


def _relationship_model(
    relationship_type: str,
    *,
    direction: str = "source-to-target",
    source_multiplicity: str | None = None,
    target_multiplicity: str | None = None,
) -> dict:
    return {
        "classes": [
            {"id": "class_child", "name": "Child", "attributes": [], "methods": [], "enabled": True},
            {"id": "class_parent", "name": "Parent", "attributes": [], "methods": [], "enabled": True},
        ],
        "relationships": [
            {
                "id": "edge_child_parent",
                "sourceClassId": "class_child",
                "targetClassId": "class_parent",
                "type": relationship_type,
                "label": relationship_type,
                "sourceMultiplicity": source_multiplicity,
                "targetMultiplicity": target_multiplicity,
                "direction": direction,
                "enabled": True,
            }
        ],
    }


@pytest.mark.parametrize(
    ("relationship_type", "style_fragments"),
    [
        ("composition", ["startArrow=diamondThin", "startFill=1", "endArrow=none"]),
        ("aggregation", ["startArrow=diamondThin", "startFill=0", "endArrow=none"]),
        ("inheritance", ["endArrow=block", "endFill=0", "dashed=0"]),
        ("dependency", ["dashed=1", "endArrow=open"]),
        ("realization", ["dashed=1", "endArrow=block", "endFill=0"]),
    ],
)
def test_xml_uses_predefined_uml_style_for_each_relationship(
    relationship_type: str, style_fragments: list[str]
) -> None:
    xml, validation = generate_drawio_xml(_relationship_model(relationship_type))

    assert validation["valid"] is True
    edge = ET.fromstring(xml).find(".//mxCell[@id='edge_child_parent']")
    assert edge is not None
    assert all(fragment in edge.attrib["style"] for fragment in style_fragments)


@pytest.mark.parametrize(
    ("direction", "style_fragments"),
    [
        ("source-to-target", ["startArrow=none", "endArrow=open"]),
        ("target-to-source", ["startArrow=open", "endArrow=none"]),
        ("bidirectional", ["startArrow=open", "endArrow=open"]),
        ("undirected", ["startArrow=none", "endArrow=none"]),
    ],
)
def test_association_direction_controls_navigability_arrows(
    direction: str, style_fragments: list[str]
) -> None:
    xml, validation = generate_drawio_xml(_relationship_model("association", direction=direction))

    assert validation["valid"] is True
    edge = ET.fromstring(xml).find(".//mxCell[@id='edge_child_parent']")
    assert edge is not None
    assert all(fragment in edge.attrib["style"] for fragment in style_fragments)


def test_cardinality_relationship_renders_both_multiplicity_labels() -> None:
    xml, validation = generate_drawio_xml(
        _relationship_model(
            "composition",
            source_multiplicity="1",
            target_multiplicity="1..*",
        )
    )

    assert validation["valid"] is True
    parsed = ET.fromstring(xml)
    source_label = parsed.find(".//mxCell[@id='edge_child_parent_source_multiplicity']")
    target_label = parsed.find(".//mxCell[@id='edge_child_parent_target_multiplicity']")
    assert source_label is not None and source_label.attrib["value"] == "1"
    assert target_label is not None and target_label.attrib["value"] == "1..*"


def test_invalid_relationship_semantics_are_rejected() -> None:
    validation = validate_class_model(
        _relationship_model("not-a-uml-relation", direction="backwards")
    )

    assert validation["valid"] is False
    assert any("unsupported type" in error for error in validation["errors"])
    assert any("invalid direction" in error for error in validation["errors"])


def test_rule_inheritance_has_child_to_parent_direction_without_multiplicity() -> None:
    analysis, _, _, class_model = _flow("A savings account extends an account.")

    assert analysis["facts"][0]["relationshipType"] == "inheritance"
    relationship = class_model["relationships"][0]
    assert relationship["sourceClassId"] == "class_savings_account"
    assert relationship["targetClassId"] == "class_account"
    assert relationship["sourceMultiplicity"] is None
    assert relationship["targetMultiplicity"] is None
