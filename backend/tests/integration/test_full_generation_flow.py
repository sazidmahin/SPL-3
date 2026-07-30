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
from app.db.models import DiagramRequirementLink, Plan, Subscription
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


def create_project(client: TestClient, token: str, workspace_id: str) -> dict:
    response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects",
        headers=auth_header(token),
        json={"name": "Integrated Generation", "description": "Full flow"},
    )
    assert response.status_code == 201
    return response.json()


def upgrade_personal_workspace(db_session: Session, workspace_id: str) -> None:
    subscription = db_session.scalar(select(Subscription).where(Subscription.workspace_id == UUID(workspace_id)))
    assert subscription is not None
    plan = db_session.scalar(select(Plan).where(Plan.code == "individual_pro"))
    assert plan is not None
    subscription.plan_id = plan.id
    db_session.commit()


def test_full_generation_flow_returns_reviewable_srs_diagram_and_traceability(
    client: TestClient, db_session: Session
) -> None:
    token = register(client, "owner-full@example.com", "Owner User")
    workspace_id = personal_workspace_id(client, token)
    project = create_project(client, token, workspace_id)
    client.get(f"/api/v1/workspaces/{workspace_id}/billing/subscription", headers=auth_header(token))
    upgrade_personal_workspace(db_session, workspace_id)

    response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/srs/generate",
        headers=auth_header(token),
        json={
            "title": "Inventory MVP",
            "raw_text": "Managers create products. Users reserve inventory. The system must respond quickly.",
            "generate_class_diagram": True,
            "diagram_methods": ["rule_based"],
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["job"]["job_type"] == "full"
    assert body["job"]["status"] == "completed"
    assert body["srs_document"]["extracted_requirements"]
    assert len(body["diagrams"]) == 1
    assert body["diagrams"][0]["current"]["drawio_xml"].startswith("<mxfile>")
    assert body["diagrams"][0]["requirement_links"]

    link = db_session.scalar(select(DiagramRequirementLink).where(DiagramRequirementLink.workspace_id == UUID(workspace_id)))
    assert link is not None
    assert link.requirement_code.startswith("REQ-")
