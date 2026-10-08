import json

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.services.hosted_ai_service import HostedAiClient
from app.services.llm_service import LlmExecutionError, LlmResponse
from app.services.srs_document_builder import build_srs_document

from tests.integration.test_generation_modes_api import (  # noqa: F401 - fixtures
    approve_and_proceed,
    auth_header,
    client,
    db_session,
    pipeline_url,
    register,
    setup_project,
)

RAW_TEXT = "A member can borrow books. Searching the catalogue must take under 2 seconds."


def test_ai_generation_requirements_follow_the_reqinone_prompts(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "openrouter_api_key", "platform-key")
    monkeypatch.setattr(settings, "openrouter_model", "vendor/model-a")
    prompts: dict[str, str] = {}

    def fake_generate(self: HostedAiClient, request):
        prompts[request.purpose] = request.prompt
        answers = {
            "pipeline_clarifications": {"facts": [], "sentences": [], "clarificationQuestions": []},
            "pipeline_final-story": {
                "atomicStorySections": [
                    {"id": "s1", "normalizedSentence": "A member can borrow books."},
                    {"id": "s2", "normalizedSentence": "Catalogue searches finish in under 2 seconds."},
                ]
            },
            "pipeline_requirements_reqinone_extraction": {
                "requirements": [
                    {
                        "statement": "The system shall allow a member to borrow books.",
                        "traceToSource": "A member can borrow books.",
                        "reason": "States a capability members need.",
                        "actor": "Member",
                        "action": "borrow",
                        "object": "Book",
                        "condition": "N/A",
                        "sourceStorySectionId": "[s1]",
                    },
                    {
                        "statement": "The system shall return catalogue search results within 2 seconds.",
                        "traceToSource": "Searching the catalogue must take under 2 seconds.",
                        "reason": "States a response-time constraint.",
                        "actor": "System",
                        "action": "return",
                        "object": "Search Result",
                        "condition": "a member searches the catalogue",
                        "sourceStorySectionId": "not-a-story-line",
                    },
                ]
            },
            "pipeline_requirements_reqinone_classification": {
                "classifications": [
                    {"index": 1, "label": "Functional"},
                    {
                        "index": 2,
                        "label": "Performance, Non-Functional Requirements",
                        "metric": "search response time",
                        "operator": "<",
                        "targetValue": "2",
                        "unit": "seconds",
                    },
                ]
            },
            "pipeline_requirements_reqinone_summary_introduction": {"introduction": "This SRS describes a library system."},
            "pipeline_requirements_reqinone_summary_stakeholders": {
                "stakeholders": [
                    {"name": "Member", "description": "Borrows books.", "traceToSource": "A member can borrow books."}
                ]
            },
        }
        if request.purpose == "pipeline_requirements_reqinone_summary_glossary":
            raise LlmExecutionError("AI generation is busy right now.")
        content = json.dumps(answers[request.purpose])
        return LlmResponse(content=content, response_payload={"content": content}, prompt_tokens=1, completion_tokens=1)

    monkeypatch.setattr(HostedAiClient, "generate", fake_generate)

    token = register(client, "reqinone@example.com")
    workspace_id, project_id = setup_project(client, token)
    base_url = pipeline_url(workspace_id, project_id)
    created = client.post(
        base_url, headers=auth_header(token), json={"title": "Library", "raw_text": RAW_TEXT, "generation_mode": "ai"}
    )
    assert created.status_code == 201, created.text
    run = created.json()
    for _ in range(3):  # input -> clarifications -> final-story -> requirements
        run = approve_and_proceed(client, token, base_url, run)
    assert run["current_stage"] == "requirements"

    # The paper's templates went out, each with the user's text as the provided information.
    extraction = prompts["pipeline_requirements_reqinone_extraction"]
    assert "The <subject clause> shall <action verb clause> <object clause>" in extraction
    assert "Trace to source:" in extraction and "Reason:" in extraction
    assert RAW_TEXT in extraction and "- [s2] Catalogue searches finish in under 2 seconds." in extraction
    assert "Answer with exactly one JSON object" in extraction
    classification = prompts["pipeline_requirements_reqinone_classification"]
    assert "There are 11 different types of non-functional requirements" in classification
    assert "1. The system shall allow a member to borrow books." in classification
    stakeholders_prompt = prompts["pipeline_requirements_reqinone_summary_stakeholders"]
    assert "USER COMMAND: Write Stakeholders/Users Section" in stakeholders_prompt
    assert "KNOWN ACTORS (the roles the requirements already use):\nMember\n" in stakeholders_prompt

    payload = next(stage for stage in run["stages"] if stage["stage_name"] == "requirements")["payload"]
    functional, performance = payload["requirements"]
    assert functional["requirementId"] == "REQ-001" and functional["requirementType"] == "functional"
    assert functional["sourceSentence"] == "A member can borrow books."
    assert functional["reason"] == "States a capability members need."
    assert functional["sourceStorySectionId"] == "s1" and functional["condition"] is None
    assert functional["actor"] == "Member" and functional["object"] == "Book"
    assert functional["metric"] is None and functional["warnings"] == []
    assert performance["requirementType"] == "non_functional" and performance["nfrCategory"] == "Performance"
    assert performance["condition"] == "a member searches the catalogue"
    assert performance["sourceStorySectionId"] is None  # not a real story line
    assert (performance["metric"], performance["operator"], performance["targetValue"], performance["unit"]) == (
        "search response time",
        "<",
        "2",
        "seconds",
    )
    assert performance["measurable"] is True
    assert payload["srsSummary"]["introduction"] == "This SRS describes a library system."
    assert payload["srsSummary"]["stakeholders"][0]["name"] == "Member"
    # A failed summary section is reported, not fatal.
    assert "glossary" not in payload["srsSummary"]
    assert any("glossary" in warning for warning in payload["warnings"])


def test_srs_document_uses_the_reqinone_summary_sections() -> None:
    markdown, content = build_srs_document(
        title="Library",
        project_name="Library",
        generation_mode="ai",
        provider="ai",
        model_name=None,
        raw_text=RAW_TEXT,
        stages={
            "requirements": {
                "requirements": [
                    {"requirementId": "REQ-001", "statement": "The system shall lend books.", "reason": "Core need."}
                ],
                "srsSummary": {
                    "introduction": "This SRS describes a library system.",
                    "stakeholders": [{"name": "Member", "description": "Borrows books.", "traceToSource": "A member can borrow books."}],
                    "glossary": [{"term": "Loan", "definition": "A book lent to a member."}],
                },
            }
        },
        generated_at=__import__("datetime").datetime(2026, 10, 8),
    )

    assert "This SRS describes a library system." in markdown
    assert "- **Member** — Borrows books. *(Source: “A member can borrow books.”)*" in markdown
    assert "- **Loan** — A book lent to a member." in markdown
    assert content["glossary"] == [{"term": "Loan", "definition": "A book lent to a member."}]
    assert content["requirements"][0]["reason"] == "Core need."
