import json
import re
from dataclasses import dataclass
from typing import Any, Protocol
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import LlmCall, PromptTemplate


class LlmServiceError(Exception):
    """Base class for expected LLM service failures."""


class PromptTemplateNotFoundError(LlmServiceError):
    pass


class PromptRenderError(LlmServiceError):
    pass


class LlmExecutionError(LlmServiceError):
    pass


class LlmConfigurationError(LlmServiceError):
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
        content = self._structured_content(request)
        words = request.prompt.split()
        completion_tokens = max(1, len(content.split()))
        return LlmResponse(
            content=content,
            response_payload={"content": content},
            prompt_tokens=len(words),
            completion_tokens=completion_tokens,
        )

    def _structured_content(self, request: LlmRequest) -> str:
        if request.purpose == "summary":
            return json.dumps(
                {
                    "introduction": "Summary generated from the supplied stakeholder requirement text.",
                    "stakeholders": ["Users identified from the supplied requirement text"],
                    "use_cases": ["UC-001: Use the system capabilities described in the supplied requirement text"],
                    "glossary": [],
                }
            )
        if request.purpose == "requirement_extraction":
            source_text = request.prompt.rsplit("Source text:", 1)[-1].strip()
            sentences = self._sentences(source_text)
            return json.dumps(
                {
                    "requirements": [
                        {
                            "requirement_code": f"REQ-{index:03d}",
                            "requirement_text": self._shall_statement(sentence),
                            "source_trace": sentence,
                            "extraction_reason": "The source text describes an expected system capability or constraint.",
                            "confidence_score": 0.75,
                        }
                        for index, sentence in enumerate(sentences, start=1)
                    ]
                }
            )
        if request.purpose == "requirement_classification":
            requirements = self._requirements_from_prompt(request.prompt)
            return json.dumps({"requirements": [self._classify(item) for item in requirements]})

        preview = " ".join(request.prompt.split()[:40])
        return f"{request.purpose}: {preview}" if preview else request.purpose

    @staticmethod
    def _sentences(text: str) -> list[str]:
        parts = [part.strip(" -\t") for part in re.split(r"[\n.;]+", text) if part.strip(" -\t")]
        return parts or ["The submitted requirement text"]

    @staticmethod
    def _shall_statement(sentence: str) -> str:
        cleaned = sentence.rstrip(".")
        if cleaned.lower().startswith("the system shall"):
            return cleaned
        return f"The system shall support {cleaned[0].lower()}{cleaned[1:]}"

    @staticmethod
    def _requirements_from_prompt(prompt: str) -> list[dict[str, Any]]:
        raw_json = prompt.rsplit("Requirements JSON:", 1)[-1].strip()
        parsed = json.loads(raw_json)
        requirements = parsed.get("requirements", [])
        return requirements if isinstance(requirements, list) else []

    @staticmethod
    def _classify(item: dict[str, Any]) -> dict[str, Any]:
        text = str(item.get("requirement_text", ""))
        lower_text = text.lower()
        subtype = None
        if any(keyword in lower_text for keyword in ["security", "secure", "auth", "password", "permission"]):
            subtype = "Security"
        elif any(keyword in lower_text for keyword in ["performance", "respond", "within", "second", "fast"]):
            subtype = "Performance"

        requirement_type = "non_functional" if subtype else "functional"
        return {
            "requirement_code": item.get("requirement_code", "REQ-001"),
            "requirement_text": text,
            "source_trace": item.get("source_trace", text),
            "extraction_reason": item.get("extraction_reason", "The item was extracted from the source text."),
            "confidence_score": item.get("confidence_score", 0.75),
            "requirement_type": requirement_type,
            "nfr_subtype": subtype,
            "classification_rationale": "Classified from the requirement wording.",
        }


def _json_ready(value: Any) -> Any:
    try:
        json.dumps(value)
        return value
    except TypeError:
        return json.loads(json.dumps(value, default=str))


def _content_to_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                text = item.get("text") or item.get("content")
                if text is not None:
                    parts.append(str(text))
            else:
                parts.append(str(item))
        if parts:
            return "".join(parts)
        return json.dumps(_json_ready(content))
    return str(content)


def _first_int(*values: Any) -> int | None:
    for value in values:
        if value is None:
            continue
        try:
            return int(value)
        except (TypeError, ValueError):
            continue
    return None


class LangChainOpenAIClient:
    provider = "openai"

    def __init__(
        self,
        *,
        api_key: str | None,
        model_name: str,
        temperature: float,
        timeout_seconds: int,
        max_retries: int,
        chat_model: Any | None = None,
    ) -> None:
        cleaned_api_key = api_key.strip() if api_key else ""
        if not cleaned_api_key and chat_model is None:
            raise LlmConfigurationError(
                "OPENAI_API_KEY is required when LLM_PROVIDER resolves to openai"
            )

        self.model_name = model_name.strip() or settings.openai_model
        if chat_model is None:
            try:
                from langchain_openai import ChatOpenAI
            except ImportError as exc:
                raise LlmConfigurationError(
                    "langchain-openai is required when LLM_PROVIDER resolves to openai"
                ) from exc

            chat_model = ChatOpenAI(
                model=self.model_name,
                api_key=cleaned_api_key,
                temperature=temperature,
                timeout=timeout_seconds,
                max_retries=max_retries,
            )
        self._chat_model = chat_model

    def generate(self, request: LlmRequest) -> LlmResponse:
        message = self._chat_model.invoke(request.prompt)
        content = _content_to_text(getattr(message, "content", message))
        usage_metadata = getattr(message, "usage_metadata", None) or {}
        if not isinstance(usage_metadata, dict):
            usage_metadata = {}
        response_metadata = getattr(message, "response_metadata", None) or {}
        if not isinstance(response_metadata, dict):
            response_metadata = {}
        token_usage = response_metadata.get("token_usage", {})
        if not isinstance(token_usage, dict):
            token_usage = {}
        prompt_tokens = _first_int(
            usage_metadata.get("input_tokens"),
            token_usage.get("prompt_tokens"),
            token_usage.get("input_tokens"),
            len(request.prompt.split()),
        )
        completion_tokens = _first_int(
            usage_metadata.get("output_tokens"),
            token_usage.get("completion_tokens"),
            token_usage.get("output_tokens"),
            max(1, len(content.split())),
        )
        return LlmResponse(
            content=content,
            response_payload={
                "content": content,
                "provider": self.provider,
                "model_name": self.model_name,
                "usage_metadata": _json_ready(usage_metadata),
                "response_metadata": _json_ready(response_metadata),
            },
            prompt_tokens=prompt_tokens or 0,
            completion_tokens=completion_tokens or 0,
        )


OPENAI_PROVIDER_NAMES = {"openai", "langchain-openai", "langchain_openai"}


def resolve_llm_provider(provider: str, openai_api_key: str | None) -> str:
    requested_provider = provider.strip().lower()
    if requested_provider == "auto":
        return "openai" if openai_api_key else "local"
    return requested_provider


def build_llm_client(
    *,
    provider: str,
    openai_api_key: str | None,
    openai_model: str,
    openai_temperature: float,
    openai_timeout_seconds: int,
    openai_max_retries: int,
) -> LlmClient:
    resolved_provider = resolve_llm_provider(provider, openai_api_key)
    if resolved_provider == "local":
        return DeterministicLlmClient()
    if resolved_provider in OPENAI_PROVIDER_NAMES:
        return LangChainOpenAIClient(
            api_key=openai_api_key,
            model_name=openai_model,
            temperature=openai_temperature,
            timeout_seconds=openai_timeout_seconds,
            max_retries=openai_max_retries,
        )
    raise LlmConfigurationError(f"Unsupported LLM_PROVIDER: {provider}")


def build_default_llm_client() -> LlmClient:
    return build_llm_client(
        provider=settings.llm_provider,
        openai_api_key=settings.openai_api_key,
        openai_model=settings.openai_model,
        openai_temperature=settings.openai_temperature,
        openai_timeout_seconds=settings.openai_timeout_seconds,
        openai_max_retries=settings.openai_max_retries,
    )


def configured_llm_model_name() -> str:
    provider = resolve_llm_provider(settings.llm_provider, settings.openai_api_key)
    if provider in OPENAI_PROVIDER_NAMES:
        return settings.openai_model
    return DeterministicLlmClient.model_name


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
        if template.purpose != purpose or template.template_text != template_text or template.status != "active":
            template.purpose = purpose
            template.template_text = template_text
            template.status = "active"
            db.commit()
            db.refresh(template)
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
    rendered = template.template_text
    for key, value in variables.items():
        rendered = rendered.replace(f"{{{key}}}", value)

    missing = re.findall(r"\{([A-Za-z_][A-Za-z0-9_]*)\}", rendered)
    if missing:
        raise PromptRenderError(f"Missing prompt variable: {missing[0]}")
    return rendered


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
    active_client = client
    prompt = render_prompt(template, variables)
    try:
        if active_client is None:
            active_client = build_default_llm_client()
        response = active_client.generate(LlmRequest(prompt=prompt, purpose=template.purpose))
    except Exception as exc:
        provider = getattr(
            active_client,
            "provider",
            resolve_llm_provider(settings.llm_provider, settings.openai_api_key),
        )
        model_name = getattr(active_client, "model_name", configured_llm_model_name())
        call = LlmCall(
            workspace_id=workspace_id,
            project_id=project_id,
            generation_job_id=generation_job_id,
            prompt_template_id=template.id,
            provider=provider,
            model_name=model_name,
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
