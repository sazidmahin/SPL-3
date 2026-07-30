import json
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from uuid import UUID

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.db import models  # noqa: F401
from app.db.base import Base
from app.db.models import Plan, Subscription, UsageCounter
from app.main import app


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSessionLocal()
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


def register(client: TestClient, email: str, full_name: str) -> str:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "correct-horse", "full_name": full_name},
    )
    assert response.status_code == 202
    code = response.json()["verification_code"]
    assert code

    verify_response = client.post(
        "/api/v1/auth/verify-email", json={"email": email, "code": code}
    )
    assert verify_response.status_code == 200
    return verify_response.json()["access_token"]


def personal_workspace_id(client: TestClient, token: str) -> str:
    response = client.get("/api/v1/workspaces", headers=auth_header(token))
    assert response.status_code == 200
    return response.json()[0]["workspace"]["id"]


def create_project(client: TestClient, token: str, workspace_id: str, name: str) -> dict:
    response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects",
        headers=auth_header(token),
        json={"name": name, "description": "Initial requirements"},
    )
    assert response.status_code == 201
    return response.json()


def upgrade_personal_workspace(db_session: Session, workspace_id: str) -> None:
    subscription = db_session.scalar(
        select(Subscription).where(Subscription.workspace_id == UUID(workspace_id))
    )
    assert subscription is not None
    plan = db_session.scalar(select(Plan).where(Plan.code == "individual_pro"))
    assert plan is not None
    subscription.plan_id = plan.id
    db_session.commit()


def create_diagram(
    client: TestClient, token: str, workspace_id: str, project_id: str, title: str
) -> dict:
    response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects/{project_id}/diagrams",
        headers=auth_header(token),
        json={
            "title": title,
            "diagram_type": "class",
            "drawio_xml": "<mxfile><diagram>v1</diagram></mxfile>",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_manual_diagram_flow_persists_versions_and_current_xml(client: TestClient, db_session: Session) -> None:
    token = register(client, "owner@example.com", "Owner User")
    workspace_id = personal_workspace_id(client, token)
    project = create_project(client, token, workspace_id, "Claims Portal")

    diagram = create_diagram(client, token, workspace_id, project["id"], "Claims Class Diagram")

    assert diagram["title"] == "Claims Class Diagram"
    assert diagram["source"] == "manual"
    assert diagram["current_version"] == 1
    assert diagram["current"]["version_number"] == 1
    assert diagram["current"]["drawio_xml"] == "<mxfile><diagram>v1</diagram></mxfile>"

    list_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/diagrams",
        headers=auth_header(token),
    )
    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [diagram["id"]]

    save_response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/diagrams/{diagram['id']}/versions",
        headers=auth_header(token),
        json={"drawio_xml": "<mxfile><diagram>v2</diagram></mxfile>"},
    )
    assert save_response.status_code == 201
    assert save_response.json()["version_number"] == 2

    detail_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/diagrams/{diagram['id']}",
        headers=auth_header(token),
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["current_version"] == 2
    assert detail_response.json()["current"]["drawio_xml"] == "<mxfile><diagram>v2</diagram></mxfile>"

    versions_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/diagrams/{diagram['id']}/versions",
        headers=auth_header(token),
    )
    assert versions_response.status_code == 200
    assert [version["version_number"] for version in versions_response.json()] == [1, 2]
    blocked_export_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/diagrams/{diagram['id']}/export",
        headers=auth_header(token),
    )
    assert blocked_export_response.status_code == 422
    assert blocked_export_response.json()["detail"] == "Current plan does not allow this feature"

    upgrade_personal_workspace(db_session, workspace_id)
    export_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/diagrams/{diagram['id']}/export",
        headers=auth_header(token),
    )
    assert export_response.status_code == 200
    assert "<mxfile><diagram>v2</diagram></mxfile>" in export_response.text
    assert export_response.headers["content-disposition"].endswith('.drawio"')


def test_diagram_access_is_scoped_to_workspace_and_project(client: TestClient) -> None:
    owner_token = register(client, "owner@example.com", "Owner User")
    other_token = register(client, "other@example.com", "Other User")
    workspace_id = personal_workspace_id(client, owner_token)
    other_workspace_id = personal_workspace_id(client, other_token)
    project = create_project(client, owner_token, workspace_id, "Claims Portal")
    other_project = create_project(client, other_token, other_workspace_id, "Other Portal")
    diagram = create_diagram(client, owner_token, workspace_id, project["id"], "Claims Diagram")

    wrong_workspace_response = client.get(
        f"/api/v1/workspaces/{other_workspace_id}/projects/{project['id']}/diagrams/{diagram['id']}",
        headers=auth_header(other_token),
    )
    assert wrong_workspace_response.status_code == 404

    wrong_project_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/projects/{other_project['id']}/diagrams/{diagram['id']}",
        headers=auth_header(owner_token),
    )
    assert wrong_project_response.status_code == 404


def test_viewer_can_read_diagrams_but_cannot_save_versions(client: TestClient) -> None:
    owner_token = register(client, "owner@example.com", "Owner User")
    viewer_token = register(client, "viewer@example.com", "Viewer User")
    workspace_response = client.post(
        "/api/v1/workspaces",
        headers=auth_header(owner_token),
        json={"name": "Design Team", "slug": "design-team", "type": "organization"},
    )
    assert workspace_response.status_code == 201
    workspace_id = workspace_response.json()["workspace"]["id"]
    project = create_project(client, owner_token, workspace_id, "Design Portal")
    diagram = create_diagram(client, owner_token, workspace_id, project["id"], "Design Diagram")

    invite_response = client.post(
        f"/api/v1/workspaces/{workspace_id}/members/invite",
        headers=auth_header(owner_token),
        json={"email": "viewer@example.com", "role": "viewer"},
    )
    assert invite_response.status_code == 201

    read_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/diagrams/{diagram['id']}",
        headers=auth_header(viewer_token),
    )
    assert read_response.status_code == 200

    create_response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/diagrams",
        headers=auth_header(viewer_token),
        json={"title": "Viewer Diagram", "diagram_type": "class", "drawio_xml": "<mxfile />"},
    )
    assert create_response.status_code == 403

    save_response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/diagrams/{diagram['id']}/versions",
        headers=auth_header(viewer_token),
        json={"drawio_xml": "<mxfile><diagram>viewer</diagram></mxfile>"},
    )
    assert save_response.status_code == 403

def test_generate_class_diagram_from_srs_document_persists_drawio_xml(
    client: TestClient, db_session: Session
) -> None:
    token = register(client, "owner@example.com", "Owner User")
    workspace_id = personal_workspace_id(client, token)
    project = create_project(client, token, workspace_id, "Claims Portal")
    client.get(
        f"/api/v1/workspaces/{workspace_id}/billing/subscription",
        headers=auth_header(token),
    )
    upgrade_personal_workspace(db_session, workspace_id)

    srs_response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/srs/generate",
        headers=auth_header(token),
        json={
            "title": "Claims MVP",
            "raw_text": "Users submit claims. Admins approve claims. The system must respond within two seconds.",
        },
    )
    assert srs_response.status_code == 201
    srs_document_id = srs_response.json()["srs_document"]["id"]

    rule_based_response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/diagrams/class/generate",
        headers=auth_header(token),
        json={"srs_document_id": srs_document_id, "methods": ["rule_based"]},
    )
    assert rule_based_response.status_code == 201
    body = rule_based_response.json()
    assert body["source"] == "generated"
    assert body["diagram_type"] == "class"
    assert body["current"]["drawio_xml"].startswith("<mxfile>")
    rule_based_diagram_json = json.loads(body["current"]["diagram_json"])
    assert rule_based_diagram_json["methods"] == ["rule_based"]
    assert {"User", "Admin", "Claim"}.issubset(rule_based_diagram_json["rule_based_extraction"]["classes"])
    assert "submitClaim()" in rule_based_diagram_json["rule_based_extraction"]["methods_by_class"]["User"]
    assert "approveClaim()" in rule_based_diagram_json["rule_based_extraction"]["methods_by_class"]["Admin"]

    llm_response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/diagrams/class/generate",
        headers=auth_header(token),
        json={"srs_document_id": srs_document_id, "methods": ["llm"]},
    )
    assert llm_response.status_code == 201
    llm_diagram_json = json.loads(llm_response.json()["current"]["diagram_json"])
    assert llm_diagram_json["methods"] == ["llm"]
    assert llm_diagram_json["generation_metadata"]["model_name"] == "deterministic-srs-v1"

    counter = db_session.scalar(
        select(UsageCounter).where(UsageCounter.workspace_id == UUID(workspace_id))
    )
    assert counter is not None
    assert counter.ai_diagram_generations == 1
