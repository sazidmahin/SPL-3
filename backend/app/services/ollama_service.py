"""Local AI generation backed by an Ollama server.

Ollama is a platform-managed local provider (no per-user API key), so it plugs
into the generation pipeline the same way :class:`SrsGenClient` does rather than
through the BYOK credential system.
"""

from __future__ import annotations

import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import settings
from app.services.llm_service import LlmConfigurationError, LlmExecutionError, LlmRequest, LlmResponse


def _base_url() -> str:
    return settings.ollama_base_url.rstrip("/")


class OllamaClient:
    provider = "ollama"

    def __init__(
        self,
        *,
        base_url: str | None = None,
        model_name: str | None = None,
        temperature: float | None = None,
        timeout_seconds: int | None = None,
        keep_alive: str | None = None,
    ) -> None:
        self.base_url = (base_url or _base_url()).rstrip("/")
        self.model_name = (model_name or settings.ollama_model).strip()
        self.temperature = settings.ollama_temperature if temperature is None else temperature
        self.timeout_seconds = timeout_seconds or settings.ollama_timeout_seconds
        self.keep_alive = keep_alive or settings.ollama_keep_alive
        if not self.model_name:
            raise LlmConfigurationError("OLLAMA_MODEL is required for local Ollama generation")

    # ------------------------------------------------------------------ helpers
    def _get(self, path: str) -> dict[str, Any]:
        request = Request(f"{self.base_url}{path}", headers={"Accept": "application/json"})
        with urlopen(request, timeout=10) as response:  # noqa: S310 - fixed local endpoint
            return json.loads(response.read().decode("utf-8"))

    def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        data = json.dumps(payload).encode("utf-8")
        request = Request(
            f"{self.base_url}{path}",
            data=data,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )
        with urlopen(request, timeout=self.timeout_seconds) as response:  # noqa: S310
            return json.loads(response.read().decode("utf-8"))

    def available_models(self) -> list[str]:
        try:
            payload = self._get("/api/tags")
        except (HTTPError, URLError, OSError, ValueError) as exc:
            raise LlmConfigurationError(
                f"Cannot reach the Ollama server at {self.base_url}. Is the 'ollama' service running?"
            ) from exc
        models = payload.get("models") or []
        names: list[str] = []
        for item in models:
            name = str(item.get("name", "")).strip()
            if name:
                names.append(name)
                names.append(name.split(":", 1)[0])
        return list(dict.fromkeys(names))

    def validate_configuration(self) -> None:
        available = self.available_models()
        wanted = self.model_name
        if wanted in available or wanted.split(":", 1)[0] in available:
            return
        raise LlmConfigurationError(
            f"Ollama model '{wanted}' is not installed on {self.base_url}. "
            f"Run: ollama pull {wanted}"
        )

    # --------------------------------------------------------------- generation
    def generate(self, request: LlmRequest) -> LlmResponse:
        try:
            chat_model = self._langchain_chat_model()
        except LlmConfigurationError:
            chat_model = None

        if chat_model is not None:
            message = chat_model.invoke(request.prompt)
            content = getattr(message, "content", message)
            if not isinstance(content, str):
                content = str(content)
            metadata = getattr(message, "response_metadata", None) or {}
            prompt_tokens = int(metadata.get("prompt_eval_count") or len(request.prompt.split()))
            completion_tokens = int(metadata.get("eval_count") or max(1, len(content.split())))
            payload: dict[str, Any] = {
                "content": content,
                "provider": self.provider,
                "model_name": self.model_name,
                "response_metadata": _json_ready(metadata),
            }
            return LlmResponse(
                content=content.strip(),
                response_payload=payload,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
            )

        # Fallback: talk to the Ollama HTTP API directly.
        body = {
            "model": self.model_name,
            "prompt": request.prompt,
            "stream": False,
            "keep_alive": self.keep_alive,
            "options": {"temperature": self.temperature},
        }
        try:
            data = self._post("/api/generate", body)
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", "ignore") if hasattr(exc, "read") else str(exc)
            raise LlmExecutionError(f"Ollama generation failed ({exc.code}): {detail}") from exc
        except (URLError, OSError, ValueError) as exc:
            raise LlmExecutionError(f"Ollama generation failed: {exc}") from exc

        content = str(data.get("response", "")).strip()
        prompt_tokens = int(data.get("prompt_eval_count") or len(request.prompt.split()))
        completion_tokens = int(data.get("eval_count") or max(1, len(content.split())))
        return LlmResponse(
            content=content,
            response_payload={
                "content": content,
                "provider": self.provider,
                "model_name": self.model_name,
                "total_duration": data.get("total_duration"),
                "done_reason": data.get("done_reason"),
            },
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
        )

    def _langchain_chat_model(self) -> Any | None:
        try:
            from langchain_ollama import ChatOllama
        except ImportError as exc:  # pragma: no cover - optional dependency
            raise LlmConfigurationError("langchain-ollama is not installed") from exc
        return ChatOllama(
            base_url=self.base_url,
            model=self.model_name,
            temperature=self.temperature,
            client_kwargs={"timeout": self.timeout_seconds},
            keep_alive=self.keep_alive,
        )


def _json_ready(value: Any) -> Any:
    try:
        json.dumps(value)
        return value
    except TypeError:
        return json.loads(json.dumps(value, default=str))


def ollama_models() -> list[str]:
    """Configured model catalogue for the Ollama provider."""
    return settings.provider_models("ollama") or [settings.ollama_model]
