from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.db import models  # noqa: F401
from app.db.base import Base
from app.db.models import UserAiProviderCredential
from app.main import app
from app.services.llm_service import LlmResponse
from app.services.ollama_service import OllamaClient


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    testing_session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = testing_session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def register(client: TestClient, email: str = "pipeline@example.com") -> str:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "correct-horse", "full_name": "Pipeline User"},
    )
    assert response.status_code == 202
    verification = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "code": response.json()["verification_code"]},
    )
    assert verification.status_code == 200
    return verification.json()["access_token"]


def setup_project(client: TestClient, token: str) -> tuple[str, str]:
    workspaces = client.get("/api/v1/workspaces", headers=auth_header(token))
    workspace_id = workspaces.json()[0]["workspace"]["id"]
    project = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects",
        headers=auth_header(token),
        json={"name": "Generation Modes", "description": None},
    )
    assert project.status_code == 201
    return workspace_id, project.json()["id"]


def pipeline_url(workspace_id: str, project_id: str) -> str:
    return f"/api/v1/workspaces/{workspace_id}/projects/{project_id}/generation-pipelines"


def approve_and_proceed(
    client: TestClient,
    token: str,
    base_url: str,
    run: dict,
) -> dict:
    current = next(stage for stage in run["stages"] if stage["stage_name"] == run["current_stage"])
    response = client.post(
        f"{base_url}/{run['id']}/stages/{run['current_stage']}/approve",
        headers=auth_header(token),
        json={"version_number": current["version_number"], "proceed": True},
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_rule_based_pipeline_is_editable_and_xml_is_deterministic(client: TestClient) -> None:
    token = register(client)
    workspace_id, project_id = setup_project(client, token)
    base_url = pipeline_url(workspace_id, project_id)
    response = client.post(
        base_url,
        headers=auth_header(token),
        json={
            "title": "Order management",
            "raw_text": "Administrator can create Order.",
            "generation_mode": "rule_based",
        },
    )
    assert response.status_code == 201, response.text
    run = response.json()

    for expected_stage in ("clarifications", "final-story", "requirements", "class-model"):
        run = approve_and_proceed(client, token, base_url, run)
        assert run["current_stage"] == expected_stage

    class_stage = next(stage for stage in run["stages"] if stage["stage_name"] == "class-model")
    add_response = client.post(
        f"{base_url}/{run['id']}/class-model/classes",
        headers=auth_header(token),
        json={
            "expected_version": class_stage["version_number"],
            "data": {"id": "class_audit_log", "name": "AuditLog"},
        },
    )
    assert add_response.status_code == 200, add_response.text
    assert any(item["name"] == "AuditLog" for item in add_response.json()["payload"]["classes"])

    run = client.get(f"{base_url}/{run['id']}", headers=auth_header(token)).json()
    run = approve_and_proceed(client, token, base_url, run)
    assert run["current_stage"] == "xml"
    xml_stage = next(stage for stage in run["stages"] if stage["stage_name"] == "xml")
    assert xml_stage["payload"]["validation"]["valid"] is True
    assert "AuditLog" in xml_stage["payload"]["xml"]

    reopen = client.post(
        f"{base_url}/{run['id']}/stages/class-model/reopen",
        headers=auth_header(token),
    )
    assert reopen.status_code == 200, reopen.text
    refreshed = client.get(f"{base_url}/{run['id']}", headers=auth_header(token)).json()
    statuses = {stage["stage_name"]: stage["status"] for stage in refreshed["stages"]}
    assert statuses["class-model"] == "ready_for_review"
    assert statuses["xml"] == "stale"


_OLLAMA_NON_JSON_RESPONSES = {
    "pipeline_clarifications_ollama_questions": (
        "Sentences: A customer can place an order. An admin can approve an order.\n"
        "What is the maximum number of items per order?\n"
        "How long should an unapproved order remain pending?\n"
        "The order total must be calculated automatically."
    ),
    "pipeline_clarifications_answer_suggestion": "Ten items",
    "pipeline_final-story_ollama_independent": (
        "A customer places an order for one or more products.\n"
        "An admin reviews and approves pending orders.\n"
        "The system automatically calculates the order total."
    ),
    "pipeline_requirements_ollama_independent": (
        "The system shall allow a customer to place an order.\n"
        "The system shall allow an admin to approve an order.\n"
        "The system shall respond within two seconds (performance)."
    ),
    "pipeline_class-model_ollama_independent": (
        "The domain centers on a Customer who places an Order containing OrderItem "
        "entries, and an Admin who approves the Order."
    ),
}


def test_ollama_pipeline_falls_back_to_text_extraction_when_model_skips_json(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Every content stage must still produce a renderable payload even when the
    local model ignores the JSON contract and answers in plain prose - this is the
    normal case for small local models, not an edge case.
    """
    monkeypatch.setattr(OllamaClient, "validate_configuration", lambda self: None)

    def fake_generate(self: OllamaClient, request):
        content = _OLLAMA_NON_JSON_RESPONSES.get(request.purpose, "No structured answer available.")
        return LlmResponse(content=content, response_payload={"content": content}, prompt_tokens=1, completion_tokens=1)

    monkeypatch.setattr(OllamaClient, "generate", fake_generate)

    token = register(client, "ollama@example.com")
    workspace_id, project_id = setup_project(client, token)
    base_url = pipeline_url(workspace_id, project_id)

    created = client.post(
        base_url,
        headers=auth_header(token),
        json={
            "title": "Order management",
            "raw_text": "A customer can place an order. An admin can approve an order.",
            "generation_mode": "ollama",
        },
    )
    assert created.status_code == 201, created.text
    run = created.json()

    # --- input: approving it generates the clarifications stage ---
    run = approve_and_proceed(client, token, base_url, run)
    assert run["current_stage"] == "clarifications"

    # --- clarifications: fallback-extracted questions, each auto-answered ---
    clarifications = next(stage for stage in run["stages"] if stage["stage_name"] == "clarifications")
    questions = clarifications["payload"]["clarificationQuestions"]
    assert len(questions) >= 1
    for question in questions:
        assert isinstance(question["id"], str) and question["id"]
        assert isinstance(question["text"], str) and question["text"]
        assert isinstance(question["category"], str) and question["category"]
    answers = clarifications["payload"]["answers"]
    assert len(answers) == len(questions)
    for answer in answers:
        assert answer.get("answerText") == "Ten items"

    # --- approve clarifications: generates final-story ---
    run = approve_and_proceed(client, token, base_url, run)
    assert run["current_stage"] == "final-story"
    final_story = next(stage for stage in run["stages"] if stage["stage_name"] == "final-story")
    sections = final_story["payload"]["atomicStorySections"]
    assert len(sections) == 3
    for section in sections:
        assert isinstance(section["id"], str) and section["id"]
        assert isinstance(section["normalizedSentence"], str) and section["normalizedSentence"]
    assert isinstance(final_story["payload"]["warnings"], list)

    # --- approve final-story: generates requirements ---
    run = approve_and_proceed(client, token, base_url, run)
    assert run["current_stage"] == "requirements"
    requirements_stage = next(stage for stage in run["stages"] if stage["stage_name"] == "requirements")
    requirements = requirements_stage["payload"]["requirements"]
    assert len(requirements) == 3
    types = {requirement["requirementType"] for requirement in requirements}
    assert types == {"functional", "non_functional"}
    for requirement in requirements:
        assert isinstance(requirement["requirementId"], str) and requirement["requirementId"]
        assert isinstance(requirement["statement"], str) and requirement["statement"]
        assert requirement["enabled"] is True

    # --- approve requirements: generates class-model ---
    run = approve_and_proceed(client, token, base_url, run)
    assert run["current_stage"] == "class-model"
    class_model_stage = next(stage for stage in run["stages"] if stage["stage_name"] == "class-model")
    classes = class_model_stage["payload"]["classes"]
    class_names = {item["name"] for item in classes}
    assert {"Customer", "Order", "OrderItem", "Admin"}.issubset(class_names)
    for item in classes:
        assert isinstance(item["id"], str) and item["id"]
        assert isinstance(item["attributes"], list)
        assert isinstance(item["methods"], list)
        assert isinstance(item["warnings"], list) and item["warnings"]
    assert class_model_stage["payload"]["relationships"] == []

    # --- approve class-model: generates xml via the deterministic renderer, even
    # though the class model itself was AI-authored ---
    run = approve_and_proceed(client, token, base_url, run)
    assert run["current_stage"] == "xml"
    xml_stage = next(stage for stage in run["stages"] if stage["stage_name"] == "xml")
    assert xml_stage["payload"]["validation"]["valid"] is True
    for name in class_names:
        assert name in xml_stage["payload"]["xml"]


def test_ai_settings_encrypt_key_and_gate_ai_gen(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    token = register(client, "byok@example.com")
    workspace_id, project_id = setup_project(client, token)
    base_url = pipeline_url(workspace_id, project_id)

    providers = client.get("/api/v1/users/me/ai-settings/providers", headers=auth_header(token))
    assert providers.status_code == 200, providers.text
    openai = next(provider for provider in providers.json() if provider["provider"] == "openai")
    assert {"gpt-5.6", "gpt-5.5", "gpt-5.4", "gpt-5.4-mini"}.issubset(openai["models"])

    blocked = client.post(
        base_url,
        headers=auth_header(token),
        json={"title": "BYOK", "raw_text": "User can create Order.", "generation_mode": "byok"},
    )
    assert blocked.status_code == 422

    api_key = "sk-secret-value-1234"
    saved = client.put(
        "/api/v1/users/me/ai-settings/credentials/openai",
        headers=auth_header(token),
        json={"api_key": api_key, "selected_model": "gpt-4o-mini", "is_default": True},
    )
    assert saved.status_code == 200, saved.text
    assert saved.json()["key_last_four"] == "1234"
    assert api_key not in saved.text
    stored = db_session.scalar(select(UserAiProviderCredential))
    assert stored is not None
    assert stored.encrypted_api_key != api_key
    assert api_key not in stored.encrypted_api_key

    monkeypatch.setattr(
        "app.services.ai_settings_service._fetch_provider_models",
        lambda provider, key: ["gpt-4.1", "gpt-4.1-nano"],
    )
    models = client.get(
        "/api/v1/users/me/ai-settings/credentials/openai/models",
        headers=auth_header(token),
    )
    assert models.status_code == 200, models.text
    assert models.json() == ["gpt-4.1", "gpt-4.1-nano"]

    custom_model = "gpt-5.4"
    updated = client.patch(
        "/api/v1/users/me/ai-settings/credentials/openai",
        headers=auth_header(token),
        json={"selected_model": custom_model},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["selected_model"] == custom_model

    class HealthyClient:
        provider = "openai"
        model_name = "gpt-4o-mini"

        def generate(self, request):
            return LlmResponse(
                content="OK",
                response_payload={"content": "OK"},
                prompt_tokens=1,
                completion_tokens=1,
            )

    monkeypatch.setattr(
        "app.services.ai_settings_service.build_client_for_credential",
        lambda credential: HealthyClient(),
    )
    tested = client.post(
        "/api/v1/users/me/ai-settings/credentials/openai/test",
        headers=auth_header(token),
    )
    assert tested.status_code == 200, tested.text
    assert tested.json()["status"] == "valid"

    created = client.post(
        base_url,
        headers=auth_header(token),
        json={"title": "BYOK", "raw_text": "User can create Order.", "generation_mode": "byok"},
    )
    assert created.status_code == 201, created.text
    assert created.json()["generation_mode"] == "byok"
    assert created.json()["provider"] == "openai"
    assert created.json()["model_name"] == custom_model
    assert api_key not in created.text
