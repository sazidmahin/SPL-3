"""Platform-managed hosted AI generation ("AI generation" in the UI).

Backed by OpenRouter's OpenAI-compatible chat completions API with a single
server-side key (OPENROUTER_API_KEY), so every user can generate without adding
their own key. Like :class:`OllamaClient` it plugs into the generation pipeline
directly rather than through the BYOK credential system.

The upstream vendor is an implementation detail: the provider is recorded as
"ai" and every message that can reach a user says "AI generation", never the
vendor name.
"""

from __future__ import annotations

import json
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import settings
from app.services.llm_service import LlmConfigurationError, LlmExecutionError, LlmRequest, LlmResponse

HOSTED_AI_PROVIDER = "ai"
_RETRYABLE_STATUS = {408, 429, 500, 502, 503, 504}


def hosted_ai_available() -> bool:
    return bool((settings.openrouter_api_key or "").strip() and settings.openrouter_model.strip())


class HostedAiClient:
    provider = HOSTED_AI_PROVIDER

    def __init__(
        self,
        *,
        model_name: str | None = None,
        api_key: str | None = None,
        base_url: str | None = None,
        temperature: float | None = None,
        timeout_seconds: int | None = None,
        max_tokens: int | None = None,
    ) -> None:
        self.api_key = (api_key or settings.openrouter_api_key or "").strip()
        self.model_name = (model_name or settings.openrouter_model).strip()
        self.base_url = (base_url or settings.openrouter_base_url).rstrip("/")
        self.temperature = settings.openrouter_temperature if temperature is None else temperature
        self.timeout_seconds = timeout_seconds or settings.openrouter_timeout_seconds
        self.max_tokens = max_tokens or settings.openrouter_max_tokens
        # Tried in order when the primary model is rate-limited or down.
        self.fallback_models = [
            model for model in settings.provider_models("openrouter_fallback") if model != self.model_name
        ]

    def validate_configuration(self) -> None:
        if not self.api_key or not self.model_name:
            raise LlmConfigurationError("AI generation is not available right now. Please try another engine.")

    # --------------------------------------------------------------- generation
    def generate(self, request: LlmRequest) -> LlmResponse:
        self.validate_configuration()
        body: dict[str, Any] = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": request.prompt}],
            "temperature": self.temperature,
            "max_tokens": request.max_tokens or self.max_tokens,
        }
        if self.fallback_models:
            body["models"] = [self.model_name, *self.fallback_models]
        if request.response_format == "json" or request.json_schema is not None:
            body["response_format"] = {"type": "json_object"}

        data = self._post_with_retry(body)
        choices = data.get("choices") or []
        if not choices:
            raise LlmExecutionError("AI generation returned an empty answer. Please try again.")
        choice = choices[0] or {}
        message = choice.get("message") or {}
        content = str(message.get("content") or "").strip()
        if not content:
            raise LlmExecutionError("AI generation returned an empty answer. Please try again.")
        usage = data.get("usage") or {}
        prompt_tokens = int(usage.get("prompt_tokens") or max(1, len(request.prompt) // 4))
        completion_tokens = int(usage.get("completion_tokens") or max(1, len(content) // 4))
        return LlmResponse(
            content=content,
            response_payload={
                "content": content,
                "provider": self.provider,
                "model_name": str(data.get("model") or self.model_name),
                "done_reason": choice.get("finish_reason"),
            },
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
        )

    def _post_with_retry(self, body: dict[str, Any]) -> dict[str, Any]:
        retries_left = max(0, settings.openrouter_max_retries)
        attempt = 0
        while True:
            try:
                return self._post(body)
            except HTTPError as exc:
                detail = _error_detail(exc)
                # Not every model supports JSON mode; the prompt already asks for
                # JSON, so drop the hint instead of failing the call.
                if exc.code == 400 and "response_format" in body:
                    body = {key: value for key, value in body.items() if key != "response_format"}
                    continue
                if exc.code in {401, 402, 403}:
                    raise LlmExecutionError("AI generation is not available right now. Please try again later.") from exc
                if exc.code in _RETRYABLE_STATUS and attempt < retries_left:
                    time.sleep(min(2**attempt, 8))
                    attempt += 1
                    continue
                if exc.code == 429:
                    raise LlmExecutionError("AI generation is busy right now. Please try again in a minute.") from exc
                raise LlmExecutionError(f"AI generation failed ({exc.code}): {detail}") from exc
            except (URLError, OSError, ValueError) as exc:
                if attempt < retries_left:
                    time.sleep(min(2**attempt, 8))
                    attempt += 1
                    continue
                raise LlmExecutionError("AI generation could not be reached. Please try again.") from exc

    def _post(self, body: dict[str, Any]) -> dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Title": settings.project_name,
        }
        if settings.openrouter_site_url:
            headers["HTTP-Referer"] = settings.openrouter_site_url
        request = Request(
            f"{self.base_url}/chat/completions",
            data=json.dumps(body).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        with urlopen(request, timeout=self.timeout_seconds) as response:  # noqa: S310 - fixed configured endpoint
            data = json.loads(response.read().decode("utf-8"))
        # Errors can also arrive with HTTP 200 (e.g. the upstream model failed mid-route).
        if isinstance(data, dict) and data.get("error"):
            error = data["error"]
            message = error.get("message") if isinstance(error, dict) else str(error)
            raise LlmExecutionError(f"AI generation failed: {_scrub(str(message))}")
        return data


def _error_detail(exc: HTTPError) -> str:
    try:
        raw = exc.read().decode("utf-8", "ignore")
        payload = json.loads(raw)
        error = payload.get("error") if isinstance(payload, dict) else None
        message = error.get("message") if isinstance(error, dict) else raw
    except Exception:  # noqa: BLE001 - best-effort error text
        message = str(exc)
    return _scrub(str(message))[:300]


def _scrub(message: str) -> str:
    """Keep the vendor name out of anything a user can see."""
    return message.replace("OpenRouter", "AI service").replace("openrouter", "ai-service")
