from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.db import models  # noqa: F401
from app.db.base import Base
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


def test_rule_api_full_flow_and_stale_later_stages(client: TestClient) -> None:
    project_response = client.post("/api/rule/v1/projects", json={"name": "Rule Demo"})
    assert project_response.status_code == 201
    project_id = project_response.json()["id"]

    story_response = client.post(
        f"/api/rule/v1/projects/{project_id}/stories",
        json={"originalText": "Orders can be deleted."},
    )
    assert story_response.status_code == 201

    clarification_response = client.post(f"/api/rule/v1/projects/{project_id}/run/clarifications")
    assert clarification_response.status_code == 200
    question = clarification_response.json()["clarificationQuestions"][0]
    assert question["triggeredRuleId"] == "CLR_MISSING_ACTOR_001"

    answer_response = client.post(
        f"/api/rule/v1/projects/{project_id}/clarifications/{question['id']}/answer",
        json={"answerText": "Administrator"},
    )
    assert answer_response.status_code == 201

    assert client.post(f"/api/rule/v1/projects/{project_id}/run/final-story").status_code == 200
    assert client.post(f"/api/rule/v1/projects/{project_id}/run/requirements").status_code == 200
    assert client.post(f"/api/rule/v1/projects/{project_id}/run/class-model").status_code == 200
    xml_response = client.post(f"/api/rule/v1/projects/{project_id}/run/xml")
    assert xml_response.status_code == 200
    assert xml_response.json()["validation"]["valid"] is True
    assert "swimlane" in xml_response.json()["xml"]
    assert "Administrator" in xml_response.json()["xml"]
    assert "Order" in xml_response.json()["xml"]
    assert "$id" not in xml_response.json()["xml"]

    assert client.post(f"/api/rule/v1/projects/{project_id}/stages/final-story/approve").status_code == 200
    assert client.post(f"/api/rule/v1/projects/{project_id}/stages/requirements/approve").status_code == 200
    assert client.post(f"/api/rule/v1/projects/{project_id}/stages/class-model/approve").status_code == 200
    assert client.post(f"/api/rule/v1/projects/{project_id}/stages/xml/approve").status_code == 200

    edited_answer = client.post(
        f"/api/rule/v1/projects/{project_id}/clarifications/{question['id']}/answer",
        json={"answerText": "Manager"},
    )
    assert edited_answer.status_code == 201

    stages = client.get(f"/api/rule/v1/projects/{project_id}/stages").json()
    stage_status = {stage["stageName"]: stage["status"] for stage in stages}
    assert stage_status["final-story"] == "STALE"
    assert stage_status["requirements"] == "STALE"
    assert stage_status["class-model"] == "STALE"
    assert stage_status["xml"] == "STALE"


def test_rule_health_and_dictionary_endpoints(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/ready").json() == {"status": "ready"}
    dictionaries = client.get("/api/rule/v1/dictionaries").json()
    assert "action_aliases" in dictionaries["dictionaries"]
    assert client.get("/api/rule/v1/dictionaries/action_aliases").status_code == 200

    entry_response = client.post(
        "/api/rule/v1/dictionaries/action_aliases/entries",
        json={"data": {"key": "ship", "value": "ship", "priority": 50}},
    )
    assert entry_response.status_code == 201
    entry_id = entry_response.json()["id"]
    patch_response = client.patch(
        f"/api/rule/v1/dictionaries/action_aliases/entries/{entry_id}",
        json={"data": {"enabled": False}},
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["enabled"] is False

    rule_response = client.patch(
        "/api/rule/v1/rules/FR_CUSTOM_001",
        json={"data": {"description": "Custom deterministic rule.", "enabled": True}},
    )
    assert rule_response.status_code == 200
    assert rule_response.json()["ruleId"] == "FR_CUSTOM_001"

