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
from app.db.models import Diagram, DiagramRequirementLink, ExtractedRequirement, Plan, SrsDocument, Subscription, UsageCounter
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
    assert response.status_code == 201
    return response.json()["access_token"]


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


def test_requirement_input_can_be_submitted_for_project(client: TestClient) -> None:
    token = register(client, "owner@example.com", "Owner User")
    workspace_id = personal_workspace_id(client, token)
    project = create_project(client, token, workspace_id, "Claims Portal")

    response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/srs/inputs",
        headers=auth_header(token),
        json={"title": "Claims MVP", "raw_text": "Users submit and track claims."},
    )

    assert response.status_code == 201
    assert response.json()["workspace_id"] == workspace_id
    assert response.json()["project_id"] == project["id"]
    assert response.json()["raw_text"] == "Users submit and track claims."


def test_srs_generation_requires_paid_plan_then_creates_completed_document(
    client: TestClient, db_session: Session
) -> None:
    token = register(client, "owner@example.com", "Owner User")
    workspace_id = personal_workspace_id(client, token)
    project = create_project(client, token, workspace_id, "Claims Portal")
    payload = {
        "title": "Claims MVP",
        "raw_text": "Users submit claims and admins approve them.",
        "generate_class_diagram": True,
        "diagram_methods": ["llm", "rule_based"],
    }

    blocked_response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/srs/generate",
        headers=auth_header(token),
        json=payload,
    )
    assert blocked_response.status_code == 422
    assert blocked_response.json()["detail"] == "Current plan does not allow this feature"

    client.get(
        f"/api/v1/workspaces/{workspace_id}/billing/subscription",
        headers=auth_header(token),
    )
    upgrade_personal_workspace(db_session, workspace_id)

    response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/srs/generate",
        headers=auth_header(token),
        json=payload,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["requirement_input"]["title"] == "Claims MVP"
    assert body["job"]["status"] == "completed"
    assert body["job"]["job_type"] == "full"
    assert body["job"]["progress_percent"] == 100
    assert body["job"]["diagram_methods"] == ["llm", "rule_based"]
    assert body["job"]["result_payload"]["requirement_count"] >= 1
    assert body["job"]["result_payload"]["diagram_count"] == 1
    assert len(body["diagrams"]) == 1
    assert body["diagrams"][0]["source"] == "generated"
    assert body["diagrams"][0]["current"]["drawio_xml"].startswith("<mxfile>")
    assert body["diagrams"][0]["requirement_links"]
    assert body["srs_document"]["title"] == "Claims MVP"
    assert "## Functional Requirements" in body["srs_document"]["content_markdown"]
    assert body["srs_document"]["extracted_requirements"]

    status_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/srs/jobs/{body['job']['id']}",
        headers=auth_header(token),
    )
    assert status_response.status_code == 200
    assert status_response.json()["id"] == body["job"]["id"]
    assert status_response.json()["status"] == "completed"

    list_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/srs/jobs",
        headers=auth_header(token),
    )
    assert list_response.status_code == 200
    assert [job["id"] for job in list_response.json()] == [body["job"]["id"]]

    documents_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/srs",
        headers=auth_header(token),
    )
    assert documents_response.status_code == 200
    assert [document["id"] for document in documents_response.json()] == [body["srs_document"]["id"]]

    detail_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/srs/{body['srs_document']['id']}",
        headers=auth_header(token),
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["extracted_requirements"][0]["requirement_code"] == "REQ-001"

    counter = db_session.scalar(
        select(UsageCounter).where(UsageCounter.workspace_id == UUID(workspace_id))
    )
    assert counter is not None
    assert counter.srs_generations == 1
    assert db_session.scalar(select(SrsDocument).where(SrsDocument.workspace_id == UUID(workspace_id))) is not None
    assert db_session.scalar(select(ExtractedRequirement).where(ExtractedRequirement.workspace_id == UUID(workspace_id))) is not None
    assert db_session.scalar(select(Diagram).where(Diagram.workspace_id == UUID(workspace_id))) is not None
    assert db_session.scalar(select(DiagramRequirementLink).where(DiagramRequirementLink.workspace_id == UUID(workspace_id))) is not None


def test_generation_job_access_is_scoped_to_workspace_and_project(
    client: TestClient, db_session: Session
) -> None:
    owner_token = register(client, "owner@example.com", "Owner User")
    other_token = register(client, "other@example.com", "Other User")
    workspace_id = personal_workspace_id(client, owner_token)
    other_workspace_id = personal_workspace_id(client, other_token)
    project = create_project(client, owner_token, workspace_id, "Claims Portal")
    other_project = create_project(client, other_token, other_workspace_id, "Other Portal")
    client.get(
        f"/api/v1/workspaces/{workspace_id}/billing/subscription",
        headers=auth_header(owner_token),
    )
    upgrade_personal_workspace(db_session, workspace_id)

    response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/srs/generate",
        headers=auth_header(owner_token),
        json={"title": "Claims", "raw_text": "Track claims."},
    )
    assert response.status_code == 201
    job_id = response.json()["job"]["id"]

    wrong_workspace_response = client.get(
        f"/api/v1/workspaces/{other_workspace_id}/projects/{project['id']}/srs/jobs/{job_id}",
        headers=auth_header(other_token),
    )
    assert wrong_workspace_response.status_code == 404

    wrong_project_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/projects/{other_project['id']}/srs/jobs/{job_id}",
        headers=auth_header(owner_token),
    )
    assert wrong_project_response.status_code == 404