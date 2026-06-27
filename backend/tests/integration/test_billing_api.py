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


def create_diagram(client: TestClient, token: str, workspace_id: str, project_id: str) -> dict:
    response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects/{project_id}/diagrams",
        headers=auth_header(token),
        json={"title": "Class Diagram", "diagram_type": "class", "drawio_xml": "<mxfile />"},
    )
    assert response.status_code == 201
    return response.json()


def test_billing_endpoints_seed_plans_subscription_usage_and_checkout(client: TestClient) -> None:
    token = register(client, "owner@example.com", "Owner User")
    workspace_id = personal_workspace_id(client, token)

    plans_response = client.get("/api/v1/billing/plans")
    assert plans_response.status_code == 200
    plan_codes = {plan["code"] for plan in plans_response.json()}
    assert {"free_individual", "individual_pro", "team", "enterprise"}.issubset(plan_codes)

    subscription_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/billing/subscription",
        headers=auth_header(token),
    )
    assert subscription_response.status_code == 200
    assert subscription_response.json()["plan"]["code"] == "free_individual"

    usage_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/billing/usage",
        headers=auth_header(token),
    )
    assert usage_response.status_code == 200
    assert usage_response.json()["manual_diagram_saves"] == 0

    checkout_response = client.post(
        f"/api/v1/workspaces/{workspace_id}/billing/checkout",
        headers=auth_header(token),
        json={"plan_code": "individual_pro"},
    )
    assert checkout_response.status_code == 200
    assert checkout_response.json()["checkout_session_id"].startswith("checkout_")
    assert checkout_response.json()["subscription"]["plan"]["code"] == "individual_pro"


def test_project_limit_blocks_free_personal_workspace(client: TestClient) -> None:
    token = register(client, "owner@example.com", "Owner User")
    workspace_id = personal_workspace_id(client, token)

    for index in range(3):
        create_project(client, token, workspace_id, f"Project {index}")

    response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects",
        headers=auth_header(token),
        json={"name": "Project 4", "description": None},
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "Workspace project limit exceeded"


def test_member_limit_blocks_organization_invite(
    client: TestClient, db_session: Session
) -> None:
    owner_token = register(client, "owner@example.com", "Owner User")
    member_token = register(client, "member@example.com", "Member User")
    workspace_response = client.post(
        "/api/v1/workspaces",
        headers=auth_header(owner_token),
        json={"name": "Small Team", "slug": "small-team", "type": "organization"},
    )
    assert workspace_response.status_code == 201
    workspace_id = workspace_response.json()["workspace"]["id"]

    subscription_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/billing/subscription",
        headers=auth_header(owner_token),
    )
    assert subscription_response.status_code == 200

    subscription = db_session.scalar(select(Subscription).where(Subscription.workspace_id == UUID(workspace_id)))
    assert subscription is not None
    plan = db_session.get(Plan, subscription.plan_id)
    assert plan is not None
    plan.max_members = 1
    db_session.commit()

    response = client.post(
        f"/api/v1/workspaces/{workspace_id}/members/invite",
        headers=auth_header(owner_token),
        json={"email": "member@example.com", "role": "member"},
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "Workspace member limit exceeded"

    me_response = client.get("/api/v1/workspaces", headers=auth_header(member_token))
    assert me_response.status_code == 200


def test_manual_diagram_save_limit_blocks_new_versions(
    client: TestClient, db_session: Session
) -> None:
    token = register(client, "owner@example.com", "Owner User")
    workspace_id = personal_workspace_id(client, token)
    project = create_project(client, token, workspace_id, "Diagram Project")

    subscription_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/billing/subscription",
        headers=auth_header(token),
    )
    assert subscription_response.status_code == 200
    subscription = db_session.scalar(select(Subscription).where(Subscription.workspace_id == UUID(workspace_id)))
    assert subscription is not None
    plan = db_session.get(Plan, subscription.plan_id)
    assert plan is not None
    plan.monthly_manual_diagram_saves = 1
    db_session.commit()

    diagram = create_diagram(client, token, workspace_id, project["id"])

    response = client.post(
        f"/api/v1/workspaces/{workspace_id}/projects/{project['id']}/diagrams/{diagram['id']}/versions",
        headers=auth_header(token),
        json={"drawio_xml": "<mxfile><diagram>v2</diagram></mxfile>"},
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "Monthly usage limit exceeded"

    counter = db_session.scalar(select(UsageCounter).where(UsageCounter.workspace_id == UUID(workspace_id)))
    assert counter is not None
    assert counter.manual_diagram_saves == 1