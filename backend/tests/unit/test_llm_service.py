from collections.abc import Generator
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import models  # noqa: F401
from app.db.base import Base
from app.services.llm_service import (
    LlmExecutionError,
    LlmRequest,
    get_or_create_prompt_template,
    execute_llm_call,
    render_prompt,
)


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


class FailingClient:
    provider = "test"
    model_name = "failing-model"

    def generate(self, request: LlmRequest):
        raise RuntimeError("provider unavailable")


def test_prompt_template_is_versioned_and_renders_variables(db_session: Session) -> None:
    template = get_or_create_prompt_template(
        db_session,
        name="summary_sections",
        purpose="summary",
        template_text="Summarize {raw_text}",
    )
    same_template = get_or_create_prompt_template(
        db_session,
        name="summary_sections",
        purpose="summary",
        template_text="Ignored update {raw_text}",
    )

    assert same_template.id == template.id
    assert template.version == 1
    assert render_prompt(template, {"raw_text": "claims workflow"}) == "Summarize claims workflow"


def test_execute_llm_call_logs_completed_call(db_session: Session) -> None:
    template = get_or_create_prompt_template(
        db_session,
        name="summary_sections",
        purpose="summary",
        template_text="Summarize {raw_text}",
    )

    call = execute_llm_call(
        db_session,
        workspace_id=uuid4(),
        project_id=uuid4(),
        generation_job_id=None,
        template=template,
        variables={"raw_text": "users submit claims"},
    )

    assert call.status == "completed"
    assert call.provider == "local"
    assert call.model_name == "deterministic-srs-v1"
    assert call.prompt_tokens > 0
    assert call.total_tokens == call.prompt_tokens + call.completion_tokens
    assert call.response_payload is not None
    assert "summary" in call.response_payload["content"]


def test_execute_llm_call_logs_failed_call(db_session: Session) -> None:
    template = get_or_create_prompt_template(
        db_session,
        name="summary_sections",
        purpose="summary",
        template_text="Summarize {raw_text}",
    )

    with pytest.raises(LlmExecutionError):
        execute_llm_call(
            db_session,
            workspace_id=uuid4(),
            project_id=uuid4(),
            generation_job_id=None,
            template=template,
            variables={"raw_text": "users submit claims"},
            client=FailingClient(),
        )