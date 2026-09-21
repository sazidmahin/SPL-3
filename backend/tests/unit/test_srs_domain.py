from app.domain.srs import RequirementDraft, build_srs_document


def test_srs_document_builder_uses_llm_structured_outputs() -> None:
    summary = {
        "introduction": "Users submit claims",
        "stakeholders": ["Users", "Administrators"],
        "use_cases": ["UC-001: Users submit claims"],
        "glossary": [],
    }
    requirements = [
        RequirementDraft(
            requirement_code="REQ-001",
            requirement_text="The system shall allow users to submit claims.",
            source_trace="Users submit claims",
            extraction_reason="Extracted by the LLM as a functional capability.",
            confidence_score=0.86,
            requirement_type="functional",
        ),
        RequirementDraft(
            requirement_code="REQ-002",
            requirement_text="The system shall respond within two seconds.",
            source_trace="The system must respond within two seconds",
            extraction_reason="Extracted by the LLM as a performance constraint.",
            confidence_score=0.82,
            requirement_type="non_functional",
            nfr_subtype="Performance",
        ),
    ]

    markdown, content_json = build_srs_document("Claims MVP", summary, requirements)

    assert "## Functional Requirements" in markdown
    assert "## Non-Functional Requirements" in markdown
    assert content_json["summary"] == summary
    assert content_json["traceability"][0]["requirement_code"] == "REQ-001"