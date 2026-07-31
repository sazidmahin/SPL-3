from uuid import uuid4

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import models  # noqa: F401
from app.db.base import Base
from app.services.srs_service import (
    build_srs_document,
    classify_requirements,
    extract_structured_requirements,
    generate_summary_sections,
)
from tests.unit.fake_llm import FakeStructuredLlmClient


def session_factory():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return engine, sessionmaker(bind=engine, autocommit=False, autoflush=False)()


def test_srs_pipeline_components_create_expected_shape() -> None:
    engine, session = session_factory()
    try:
        workspace_id = uuid4()
        project_id = uuid4()
        job_id = uuid4()
        raw_text = "Users submit claims. The system must respond within two seconds. Admins approve claims."
        client = FakeStructuredLlmClient()

        summary = generate_summary_sections(
            session,
            workspace_id=workspace_id,
            project_id=project_id,
            generation_job_id=job_id,
            raw_text=raw_text,
            client=client,
        )
        extracted = extract_structured_requirements(
            session,
            workspace_id=workspace_id,
            project_id=project_id,
            generation_job_id=job_id,
            raw_text=raw_text,
            client=client,
        )
        classified = classify_requirements(
            session,
            workspace_id=workspace_id,
            project_id=project_id,
            generation_job_id=job_id,
            requirements=extracted,
            client=client,
        )
        markdown, content_json = build_srs_document("Claims MVP", summary, classified)

        assert summary["introduction"]
        assert extracted[0].requirement_code == "REQ-001"
        assert extracted[0].source_trace == "Users submit claims"
        assert any(item.requirement_type == "non_functional" for item in classified)
        assert "## Non-Functional Requirements" in markdown
        assert content_json["traceability"][0]["requirement_code"] == "REQ-001"
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()