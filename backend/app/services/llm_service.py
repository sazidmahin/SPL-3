from dataclasses import dataclass
from typing import Protocol
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import LlmCall, PromptTemplate


class LlmServiceError(Exception):
    """Base class for expected LLM service failures."""


class PromptTemplateNotFoundError(LlmServiceError):
    pass


class PromptRenderError(LlmServiceError):
    pass


class LlmExecutionError(LlmServiceError):
    pass


@dataclass(frozen=True)
class LlmRequest:
    prompt: str
    purpose: str


@dataclass(frozen=True)
class LlmResponse:
    content: str
    response_payload: dict
    prompt_tokens: int
    completion_tokens: int

    @property
    def total_tokens(self) -> int:
        return self.prompt_tokens + self.completion_tokens


class LlmClient(Protocol):
    provider: str
    model_name: str

    def generate(self, request: LlmRequest) -> LlmResponse:
        """Generate text for the supplied prompt."""


class DeterministicLlmClient:
    provider = "local"
    model_name = "deterministic-srs-v1"

    def generate(self, request: LlmRequest) -> LlmResponse:
        words = request.prompt.split()
        preview = " ".join(words[:40])
        content = f"{request.purpose}: {preview}" if preview else request.purpose
        completion_tokens = max(1, len(content.split()))
        return LlmResponse(
            content=content,
            response_payload={"content": content},
            prompt_tokens=len(words),
            completion_tokens=completion_tokens,
        )


def get_or_create_prompt_template(
    db: Session,
    *,
    name: str,
    purpose: str,
    template_text: str,
) -> PromptTemplate:
    template = db.scalar(
        select(PromptTemplate).where(
            PromptTemplate.name == name,
            PromptTemplate.version == 1,
        )
    )
    if template is not None:
        return template

    template = PromptTemplate(
        name=name,
        version=1,
        purpose=purpose,
        template_text=template_text,
        status="active",
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def get_active_prompt_template(db: Session, *, name: str) -> PromptTemplate:
    template = db.scalar(
        select(PromptTemplate)
        .where(PromptTemplate.name == name, PromptTemplate.status == "active")
        .order_by(PromptTemplate.version.desc())
    )
    if template is None:
        raise PromptTemplateNotFoundError("Prompt template not found")
    return template


def render_prompt(template: PromptTemplate, variables: dict[str, str]) -> str:
    try:
        return template.template_text.format(**variables)
    except KeyError as exc:
        missing = str(exc).strip("'")
        raise PromptRenderError(f"Missing prompt variable: {missing}") from exc


def execute_llm_call(
    db: Session,
    *,
    workspace_id: UUID,
    project_id: UUID,
    generation_job_id: UUID | None,
    template: PromptTemplate,
    variables: dict[str, str],
    client: LlmClient | None = None,
) -> LlmCall:
    active_client = client or DeterministicLlmClient()
    prompt = render_prompt(template, variables)
    try:
        response = active_client.generate(LlmRequest(prompt=prompt, purpose=template.purpose))
    except Exception as exc:
        call = LlmCall(
            workspace_id=workspace_id,
            project_id=project_id,
            generation_job_id=generation_job_id,
            prompt_template_id=template.id,
            provider=active_client.provider,
            model_name=active_client.model_name,
            status="failed",
            prompt_text=prompt,
            response_payload=None,
            error_message=str(exc),
        )
        db.add(call)
        db.commit()
        db.refresh(call)
        raise LlmExecutionError(str(exc)) from exc

    call = LlmCall(
        workspace_id=workspace_id,
        project_id=project_id,
        generation_job_id=generation_job_id,
        prompt_template_id=template.id,
        provider=active_client.provider,
        model_name=active_client.model_name,
        status="completed",
        prompt_text=prompt,
        response_payload=response.response_payload,
        prompt_tokens=response.prompt_tokens,
        completion_tokens=response.completion_tokens,
        total_tokens=response.total_tokens,
    )
    db.add(call)
    db.commit()
    db.refresh(call)
    return call