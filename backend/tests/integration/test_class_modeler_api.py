import json
from collections.abc import Generator
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.db import models  # noqa: F401
from app.db.base import Base
from app.db.models import LlmCall
from app.main import app
from app.services.llm_service import LlmResponse
from app.services.ollama_service import OllamaClient

TASK = (
    "A library has many books. Each book has a title and an ISBN. A member can borrow up to five books. "
    "A librarian is a kind of staff member."
)


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, autocommit=False, autoflush=False)()
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


def register(client: TestClient, email: str = "modeler@example.com") -> str:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "correct-horse", "full_name": "Modeler User"},
    )
    assert response.status_code == 202
    verification = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "code": response.json()["verification_code"]},
    )
    assert verification.status_code == 200
    return verification.json()["access_token"]


def setup_project(client: TestClient, token: str) -> tuple[str, str]:
    workspace_id = client.get("/api/v1/workspaces", headers=auth_header(token)).json()[0]["workspace"]["id"]
    project = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects",
        headers=auth_header(token),
        json={"name": "OOP Tasks", "description": None},
    )
    assert project.status_code == 201
    return workspace_id, project.json()["id"]


def test_rule_based_mode_needs_no_project_and_explains_itself(client: TestClient) -> None:
    token = register(client)
    workspace_id, _ = setup_project(client, token)

    response = client.post(
        f"/api/v1/workspaces/{workspace_id}/class-modeler/generate",
        headers=auth_header(token),
        json={"text": TASK, "mode": "rule_based"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "rule_based"
    names = {cls["name"] for cls in body["model"]["classes"]}
    assert {"Book", "Member", "Librarian", "StaffMember", "Library"} <= names
    assert body["validation"]["valid"] is True
    assert body["drawioXml"].startswith("<mxfile")
    assert body["analysis"]["sentences"] and body["analysis"]["nouns"] and body["analysis"]["verbs"]


def test_rejects_empty_text_and_unknown_mode(client: TestClient) -> None:
    token = register(client)
    workspace_id, _ = setup_project(client, token)
    url = f"/api/v1/workspaces/{workspace_id}/class-modeler/generate"

    assert client.post(url, headers=auth_header(token), json={"text": "   ", "mode": "rule_based"}).status_code == 422
    assert client.post(url, headers=auth_header(token), json={"text": TASK, "mode": "magic"}).status_code == 422


def test_llm_mode_requires_project_then_normalizes_model(
    client: TestClient, db_session: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    token = register(client)
    workspace_id, project_id = setup_project(client, token)
    url = f"/api/v1/workspaces/{workspace_id}/class-modeler/generate"

    no_project = client.post(url, headers=auth_header(token), json={"text": TASK, "mode": "llm"})
    assert no_project.status_code == 422
    assert "project" in no_project.json()["detail"].lower()

    # Uses the user's own provider (or local Ollama): no paid plan needed.
    llm_answer = {
        "classes": [
            {"name": "Book", "attributes": [{"name": "title", "type": "String"}, "isbn: String"], "methods": []},
            {"name": "Member", "attributes": [], "methods": [
                {"name": "borrowBook", "parameters": [{"name": "book", "type": "Book"}], "returnType": "void"}
            ]},
            {"name": "Librarian", "attributes": [], "methods": ["addBook(book: Book): void"]},
            {"name": "StaffMember", "abstract": True, "attributes": [], "methods": []},
        ],
        "relationships": [
            {"from": "Member", "to": "Book", "type": "association", "label": "borrows",
             "sourceMultiplicity": "1", "targetMultiplicity": "0..5"},
            {"from": "Librarian", "to": "StaffMember", "type": "generalization"},
            {"from": "Member", "to": "Ghost", "type": "association"},
        ],
        "enums": [],
        "nouns": [{"name": "library", "decision": "rejected", "reason": "system name"}],
        "verbs": [{"verb": "borrow", "subject": "Member", "object": "Book", "assignedTo": "Member", "method": "borrowBook(book)"}],
    }
    monkeypatch.setattr(OllamaClient, "validate_configuration", lambda self: None)

    def fake_generate(self: OllamaClient, request):
        assert "REQUIREMENT_TEXT_START" in request.prompt and TASK in request.prompt
        content = json.dumps(llm_answer)
        return LlmResponse(content=content, response_payload={"content": content}, prompt_tokens=10, completion_tokens=10)

    monkeypatch.setattr(OllamaClient, "generate", fake_generate)

    response = client.post(url, headers=auth_header(token), json={"text": TASK, "mode": "llm", "project_id": project_id})

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["mode"] == "llm" and body["provider"] == "ollama"
    classes = {cls["name"]: cls for cls in body["model"]["classes"]}
    assert classes["StaffMember"]["stereotype"] == "abstract"
    assert [attr["name"] for attr in classes["Book"]["attributes"]] == ["title", "isbn"]
    assert classes["Librarian"]["methods"][0]["parameters"] == [{"name": "book", "type": "Book"}]
    types = sorted(rel["type"] for rel in body["model"]["relationships"])
    assert types == ["association", "inheritance"]  # the edge to an unknown class is dropped
    assert body["validation"]["valid"] is True
    assert body["analysis"]["nouns"][0]["decision"] == "rejected"
    assert db_session.scalar(select(LlmCall).where(LlmCall.project_id == UUID(project_id))) is not None
