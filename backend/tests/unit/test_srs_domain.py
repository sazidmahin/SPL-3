from app.domain.srs import (
    build_summary_sections,
    build_srs_document,
    classify_requirement_drafts,
    extract_requirement_drafts,
)


def test_srs_domain_pipeline_is_pure_and_structured() -> None:
    raw_text = "Users submit claims. The system must respond within two seconds. Admins approve claims."

    summary = build_summary_sections(raw_text)
    extracted = extract_requirement_drafts(raw_text)
    classified = classify_requirement_drafts(extracted)
    markdown, content_json = build_srs_document("Claims MVP", summary, classified)

    assert summary["introduction"] == "Users submit claims"
    assert summary["stakeholders"] == ["Users", "Administrators"]
    assert extracted[0].requirement_code == "REQ-001"
    assert any(item.requirement_type == "non_functional" for item in classified)
    assert "## Functional Requirements" in markdown
    assert content_json["traceability"][0]["requirement_code"] == "REQ-001"
