import sys
from collections.abc import Generator
from types import ModuleType
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import models  # noqa: F401
from app.db.base import Base
from app.services.llm_service import (
    DeterministicLlmClient,
    LangChainOpenAIClient,
    LlmConfigurationError,
    LlmExecutionError,
    LlmRequest,
    build_llm_client,
    execute_llm_call,
    get_or_create_prompt_template,
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


def test_auto_provider_without_key_uses_deterministic_client() -> None:
    client = build_llm_client(
        provider="auto",
        openai_api_key=None,
        openai_model="gpt-test",
        openai_temperature=0,
        openai_timeout_seconds=30,
        openai_max_retries=2,
    )

    assert isinstance(client, DeterministicLlmClient)


def test_openai_provider_requires_api_key() -> None:
    with pytest.raises(LlmConfigurationError):
        build_llm_client(
            provider="openai",
            openai_api_key=None,
            openai_model="gpt-test",
            openai_temperature=0,
            openai_timeout_seconds=30,
            openai_max_retries=2,
        )


def test_langchain_openai_client_invokes_chat_model(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, object] = {}
    fake_module = ModuleType("langchain_openai")

    class FakeMessage:
        content = [{"type": "text", "text": "generated content"}]
        usage_metadata = {"input_tokens": 3, "output_tokens": 5}
        response_metadata = {"token_usage": {"total_tokens": 8}}

    class FakeChatOpenAI:
        def __init__(self, **kwargs: object) -> None:
            captured["kwargs"] = kwargs

        def invoke(self, prompt: str) -> FakeMessage:
            captured["prompt"] = prompt
            return FakeMessage()

    fake_module.ChatOpenAI = FakeChatOpenAI
    monkeypatch.setitem(sys.modules, "langchain_openai", fake_module)

    client = LangChainOpenAIClient(
        api_key="sk-test",
        model_name="gpt-test",
        temperature=0,
        timeout_seconds=30,
        max_retries=2,
    )
    response = client.generate(LlmRequest(prompt="Summarize claims", purpose="summary"))

    assert captured["kwargs"] == {
        "model": "gpt-test",
        "api_key": "sk-test",
        "temperature": 0,
        "timeout": 30,
        "max_retries": 2,
    }
    assert captured["prompt"] == "Summarize claims"
    assert response.content == "generated content"
    assert response.prompt_tokens == 3
    assert response.completion_tokens == 5
    assert response.total_tokens == 8
    assert response.response_payload["provider"] == "openai"
    assert response.response_payload["model_name"] == "gpt-test"


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