from dataclasses import dataclass


@dataclass(frozen=True)
class RequirementDraft:
    requirement_code: str
    requirement_text: str
    source_trace: str
    extraction_reason: str
    confidence_score: float
    requirement_type: str = "functional"
    nfr_subtype: str | None = None


def build_srs_document(title: str, summary: dict, requirements: list[RequirementDraft]) -> tuple[str, dict]:
    functional = [item for item in requirements if item.requirement_type == "functional"]
    non_functional = [item for item in requirements if item.requirement_type == "non_functional"]
    glossary_lines = [
        f"- **{item['term']}**: {item['definition']}" for item in summary.get("glossary", [])
    ]
    markdown_lines = [
        f"# {title}",
        "",
        "## Introduction",
        summary["introduction"],
        "",
        "## Stakeholders",
        *[f"- {stakeholder}" for stakeholder in summary["stakeholders"]],
        "",
        "## Use Cases",
        *[f"- {use_case}" for use_case in summary["use_cases"]],
        "",
        "## Functional Requirements",
        *[f"- {item.requirement_code}: {item.requirement_text}" for item in functional],
        "",
        "## Non-Functional Requirements",
        *[
            f"- {item.requirement_code} ({item.nfr_subtype}): {item.requirement_text}"
            for item in non_functional
        ],
        "",
        "## Glossary",
        *(glossary_lines or ["- No glossary terms identified."]),
    ]
    content_json = {
        "summary": summary,
        "requirements": [item.__dict__ for item in requirements],
        "traceability": [
            {
                "requirement_code": item.requirement_code,
                "source_trace": item.source_trace,
                "confidence_score": item.confidence_score,
            }
            for item in requirements
        ],
    }
    return "\n".join(markdown_lines), content_json