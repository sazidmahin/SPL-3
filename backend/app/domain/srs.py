import re
from dataclasses import dataclass

NFR_KEYWORDS = {
    "security": "Security",
    "secure": "Security",
    "auth": "Security",
    "permission": "Security",
    "performance": "Performance",
    "fast": "Performance",
    "response": "Performance",
    "within": "Performance",
    "available": "Availability",
    "availability": "Availability",
    "usable": "Usability",
    "usability": "Usability",
    "accessible": "Usability",
    "scale": "Scalability",
    "scalable": "Scalability",
    "maintain": "Maintainability",
    "portable": "Portability",
    "legal": "Legal",
    "fault": "Fault Tolerance",
    "operate": "Operational",
}


@dataclass(frozen=True)
class RequirementDraft:
    requirement_code: str
    requirement_text: str
    source_trace: str
    extraction_reason: str
    confidence_score: float
    requirement_type: str = "functional"
    nfr_subtype: str | None = None


def sentences(raw_text: str) -> list[str]:
    candidates = re.split(r"[\n.;]+", raw_text)
    return [candidate.strip(" -\t") for candidate in candidates if candidate.strip(" -\t")]


def words(raw_text: str) -> list[str]:
    return re.findall(r"[A-Za-z][A-Za-z0-9_-]*", raw_text)


def build_summary_sections(raw_text: str) -> dict:
    sentence_list = sentences(raw_text)
    first_sentence = sentence_list[0] if sentence_list else raw_text.strip()
    lower_text = raw_text.lower()
    stakeholders = ["Users"]
    if any(keyword in lower_text for keyword in ["admin", "manager", "owner"]):
        stakeholders.append("Administrators")
    if any(keyword in lower_text for keyword in ["customer", "client"]):
        stakeholders.append("Customers")

    use_cases = [f"UC-{index:03d}: {sentence}" for index, sentence in enumerate(sentence_list[:5], start=1)]
    glossary_terms = []
    for word in words(raw_text):
        normalized = word.strip().lower()
        if len(normalized) >= 7 and normalized not in glossary_terms:
            glossary_terms.append(normalized)
        if len(glossary_terms) == 6:
            break

    return {
        "introduction": first_sentence,
        "stakeholders": stakeholders,
        "use_cases": use_cases or ["UC-001: Review submitted requirements"],
        "glossary": [
            {"term": term.title(), "definition": f"Domain term identified from requirement input: {term}."}
            for term in glossary_terms
        ],
    }


def extract_requirement_drafts(raw_text: str) -> list[RequirementDraft]:
    drafts = []
    for index, sentence in enumerate(sentences(raw_text), start=1):
        cleaned = sentence.rstrip(".")
        if len(cleaned.split()) < 2:
            continue
        requirement_text = cleaned
        if not cleaned.lower().startswith("the system shall"):
            requirement_text = f"The system shall support {cleaned[0].lower()}{cleaned[1:]}"
        drafts.append(
            RequirementDraft(
                requirement_code=f"REQ-{index:03d}",
                requirement_text=requirement_text,
                source_trace=sentence,
                extraction_reason="Sentence expresses an actor, capability, constraint, or expected behavior.",
                confidence_score=0.86,
            )
        )

    if not drafts:
        drafts.append(
            RequirementDraft(
                requirement_code="REQ-001",
                requirement_text="The system shall capture the submitted requirement input for review.",
                source_trace=raw_text.strip(),
                extraction_reason="Fallback requirement created from unstructured input.",
                confidence_score=0.7,
            )
        )
    return drafts


def classify_requirement_drafts(requirements: list[RequirementDraft]) -> list[RequirementDraft]:
    classified = []
    for item in requirements:
        lower_text = item.requirement_text.lower()
        subtype = next(
            (nfr_subtype for keyword, nfr_subtype in NFR_KEYWORDS.items() if keyword in lower_text),
            None,
        )
        classified.append(
            RequirementDraft(
                requirement_code=item.requirement_code,
                requirement_text=item.requirement_text,
                source_trace=item.source_trace,
                extraction_reason=item.extraction_reason,
                confidence_score=item.confidence_score,
                requirement_type="non_functional" if subtype else "functional",
                nfr_subtype=subtype,
            )
        )
    return classified


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
