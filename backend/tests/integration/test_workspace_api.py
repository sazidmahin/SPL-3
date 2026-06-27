from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.db import models  # noqa: F401
from app.db.base import Base
from app.db.models import Workspace, WorkspaceMember
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


def register(client: TestClient, email: str, full_name: str) -> str:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "correct-horse", "full_name": full_name},
    )
    assert response.status_code == 201
    return response.json()["access_token"]


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_list_workspaces_returns_only_current_users_active_memberships(
    client: TestClient, db_session: Session
) -> None:
    ada_token = register(client, "ada@example.com", "Ada Lovelace")
    bob_token = register(client, "bob@example.com", "Bob Stone")

    response = client.get("/api/v1/workspaces", headers=auth_header(ada_token))

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["workspace"]["type"] == "personal"
    assert body[0]["role"] == "owner"

    bob_workspace = db_session.scalar(
        select(Workspace).where(Workspace.slug.like("bob-stone-%"))
    )
    assert bob_workspace is not None

    forbidden_response = client.get(
        f"/api/v1/workspaces/{bob_workspace.id}", headers=auth_header(ada_token)
    )
    assert forbidden_response.status_code == 404

    bob_response = client.get("/api/v1/workspaces", headers=auth_header(bob_token))
    assert bob_response.status_code == 200
    assert len(bob_response.json()) == 1


def test_create_organization_workspace_adds_owner_membership(
    client: TestClient, db_session: Session
) -> None:
    token = register(client, "owner@example.com", "Owner User")

    response = client.post(
        "/api/v1/workspaces",
        headers=auth_header(token),
        json={"name": "Design Team", "slug": "design-team", "type": "organization"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["workspace"]["name"] == "Design Team"
    assert body["workspace"]["slug"] == "design-team"
    assert body["workspace"]["type"] == "organization"
    assert body["role"] == "owner"

    workspace = db_session.scalar(select(Workspace).where(Workspace.slug == "design-team"))
    assert workspace is not None
    membership = db_session.scalar(
        select(WorkspaceMember).where(WorkspaceMember.workspace_id == workspace.id)
    )
    assert membership is not None
    assert membership.role == "owner"


def test_workspace_detail_requires_active_membership(client: TestClient) -> None:
    owner_token = register(client, "owner@example.com", "Owner User")
    other_token = register(client, "other@example.com", "Other User")
    create_response = client.post(
        "/api/v1/workspaces",
        headers=auth_header(owner_token),
        json={"name": "API Team", "slug": "api-team", "type": "organization"},
    )
    workspace_id = create_response.json()["workspace"]["id"]

    owner_response = client.get(
        f"/api/v1/workspaces/{workspace_id}", headers=auth_header(owner_token)
    )
    other_response = client.get(
        f"/api/v1/workspaces/{workspace_id}", headers=auth_header(other_token)
    )

    assert owner_response.status_code == 200
    assert other_response.status_code == 404


def test_owner_can_invite_registered_user_and_member_cannot_manage_members(
    client: TestClient,
) -> None:
    owner_token = register(client, "owner@example.com", "Owner User")
    member_token = register(client, "member@example.com", "Member User")
    create_response = client.post(
        "/api/v1/workspaces",
        headers=auth_header(owner_token),
        json={"name": "Product Team", "slug": "product-team", "type": "organization"},
    )
    workspace_id = create_response.json()["workspace"]["id"]

    invite_response = client.post(
        f"/api/v1/workspaces/{workspace_id}/members/invite",
        headers=auth_header(owner_token),
        json={"email": "member@example.com", "role": "member"},
    )

    assert invite_response.status_code == 201
    assert invite_response.json()["role"] == "member"

    members_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/members", headers=auth_header(owner_token)
    )
    assert members_response.status_code == 200
    assert len(members_response.json()) == 2

    forbidden_response = client.get(
        f"/api/v1/workspaces/{workspace_id}/members", headers=auth_header(member_token)
    )
    assert forbidden_response.status_code == 403
