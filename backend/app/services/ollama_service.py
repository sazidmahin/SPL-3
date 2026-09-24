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


class OllamaRepeatLoopAborted(LlmExecutionError):
    """Ollama's own hard circuit breaker (separate from our repeat_penalty
    tuning - see Settings.ollama_repeat_penalty) aborted generation outright
    because the model got stuck repeating itself. A distinct type so
    OllamaClient.generate() can retry automatically (see _MAX_REPEAT_ABORT_RETRIES)
    instead of making the caller click regenerate by hand - with temperature > 0
    this is usually a one-attempt-unlucky failure, not a deterministic dead end."""


def _raise_ollama_failure(detail: str, *, cause: BaseException | None = None) -> None:
    """Raise with a message that explains what a bare engine string like
    "prediction aborted, token repeat limit reached" actually means, instead of
    surfacing it as-is."""
    if "token repeat limit" in detail.lower() or "prediction aborted" in detail.lower():
        raise OllamaRepeatLoopAborted(
            "Ollama aborted this generation because the model got stuck repeating itself "
            "(its own token-repeat safety limit, not a bug in the request). Try regenerating "
            "this stage - it often succeeds on a retry - or switch to a larger model "
            "(e.g. qwen2.5) if this keeps happening on this task."
        ) from cause
    raise LlmExecutionError(f"Ollama generation failed: {detail}") from cause


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
        num_ctx: int | None = None,
        num_predict: int | None = None,
        repeat_penalty: float | None = None,
        repeat_last_n: int | None = None,
    ) -> None:
        self.base_url = (base_url or _base_url()).rstrip("/")
        self.model_name = (model_name or settings.ollama_model).strip()
        self.temperature = settings.ollama_temperature if temperature is None else temperature
        self.timeout_seconds = timeout_seconds or settings.ollama_timeout_seconds
        self.keep_alive = keep_alive or settings.ollama_keep_alive
        self.num_ctx_max = num_ctx or settings.ollama_num_ctx
        # Cap output length: without this, a small local model asked to do a task
        # beyond its ability can ramble/repeat indefinitely instead of naturally
        # stopping, turning a call that should take seconds into one that takes
        # minutes and often still fails to produce usable JSON.
        self.num_predict = num_predict or settings.ollama_num_predict
        # See Settings.ollama_repeat_penalty - counters greedy-decoding repetition
        # loops (a stuck model re-emitting the same tokens until num_predict cuts
        # it off) without touching temperature/determinism otherwise.
        self.repeat_penalty = settings.ollama_repeat_penalty if repeat_penalty is None else repeat_penalty
        self.repeat_last_n = settings.ollama_repeat_last_n if repeat_last_n is None else repeat_last_n
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

    def embed(self, text: str, *, model: str | None = None) -> list[float]:
        """Embed a short piece of text via Ollama's embedding endpoint.

        Used only by the RAG correction-memory feature (rag_service.py), gated by
        RAG_ENABLED - embedding calls are cheap (a single forward pass, not
        autoregressive generation) so this stays fast even on CPU, but it is still
        a network round trip, so callers should skip it entirely when RAG is off.
        """
        embed_model = (model or settings.ollama_embed_model).strip()
        try:
            data = self._post("/api/embeddings", {"model": embed_model, "prompt": text})
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", "ignore") if hasattr(exc, "read") else str(exc)
            raise LlmExecutionError(f"Ollama embedding failed ({exc.code}): {detail}") from exc
        except (URLError, OSError, ValueError) as exc:
            raise LlmExecutionError(f"Ollama embedding failed: {exc}") from exc
        embedding = data.get("embedding")
        if not isinstance(embedding, list) or not embedding:
            raise LlmExecutionError("Ollama embedding response had no embedding vector")
        return [float(value) for value in embedding]

    def validate_configuration(self) -> None:
        available = self.available_models()
        wanted = self.model_name
        if wanted in available or wanted.split(":", 1)[0] in available:
            return
        raise LlmConfigurationError(
            f"Ollama model '{wanted}' is not installed on {self.base_url}. "
            f"Run: ollama pull {wanted}"
        )

    def _context_window_for(self, prompt: str) -> int:
        """Size the KV cache to what the prompt actually needs.

        On CPU, attention cost scales with num_ctx regardless of how much of it
        is used, so always requesting the configured max (e.g. 16384) makes
        short prompts pay the cost of the longest one. Round up to the next
        power of two, floor 2048, capped at ``num_ctx_max``.

        Headroom must track self.num_predict, not a flat guess: a stage allowed
        to generate up to num_predict tokens (e.g. 4096 for class-model/
        requirements/final-story - see _OLLAMA_VERBOSE_STAGE_NUM_PREDICT) needs
        that much room actually reserved, or a long prompt (a big SRS input plus
        upstream JSON) sizes num_ctx to fit only a short completion - the model
        then runs out of context mid-generation on exactly the largest, most
        complex inputs, producing garbled/truncated JSON (observed: relationships
        silently coming back empty) instead of a clear error.
        """
        estimated_tokens = int(len(prompt) / 3.2) + self.num_predict  # ~chars-per-token + completion headroom
        window = 2048
        while window < estimated_tokens and window < self.num_ctx_max:
            window *= 2
        return min(window, self.num_ctx_max)

    # --------------------------------------------------------------- generation
    # Temperature > 0 (see Settings.ollama_temperature) means a repeat-loop abort
    # is usually one unlucky sampling path, not a deterministic dead end - a
    # couple of automatic retries turn most of these into a successful call
    # instead of pushing the user to click regenerate by hand each time.
    _MAX_REPEAT_ABORT_RETRIES = 2

    def generate(self, request: LlmRequest) -> LlmResponse:
        attempt = 0
        while True:
            try:
                return self._generate_once(request)
            except OllamaRepeatLoopAborted:
                if attempt >= self._MAX_REPEAT_ABORT_RETRIES:
                    raise
                attempt += 1

    def _generate_once(self, request: LlmRequest) -> LlmResponse:
        num_ctx = self._context_window_for(request.prompt)
        try:
            chat_model = self._langchain_chat_model(num_ctx, response_format=request.response_format)
        except LlmConfigurationError:
            chat_model = None

        if chat_model is not None:
            try:
                message = chat_model.invoke(request.prompt)
            except Exception as exc:
                # langchain-ollama surfaces a server-side abort (e.g. the "token
                # repeat limit" circuit breaker - see _raise_ollama_failure) as
                # ollama.ResponseError(error, status_code), whose str() is
                # "<error> (status code: <n>)" - exactly the raw message this was
                # previously leaking unwrapped, since this call had no try/except
                # at all (unlike the raw-HTTP fallback path below it).
                detail = str(getattr(exc, "error", None) or exc)
                _raise_ollama_failure(detail, cause=exc)
                raise  # pragma: no cover - _raise_ollama_failure always raises
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
            "options": {
                "temperature": self.temperature,
                "num_ctx": num_ctx,
                "num_predict": self.num_predict,
                "repeat_penalty": self.repeat_penalty,
                "repeat_last_n": self.repeat_last_n,
            },
        }
        if request.response_format == "json":
            # Ollama's own grammar-constrained decoding (not a text-parsing rule of
            # ours) - it forces every sampled token to keep the output valid JSON,
            # instead of us trying to parse/repair whatever free text comes back.
            body["format"] = "json"
        try:
            data = self._post("/api/generate", body)
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", "ignore") if hasattr(exc, "read") else str(exc)
            _raise_ollama_failure(detail, cause=exc)
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

    def _langchain_chat_model(self, num_ctx: int, *, response_format: str | None = None) -> Any | None:
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
            num_ctx=num_ctx,
            num_predict=self.num_predict,
            repeat_penalty=self.repeat_penalty,
            repeat_last_n=self.repeat_last_n,
            # "format" is a real ChatOllama field (confirmed against the
            # installed langchain-ollama version), not a generic kwarg - set
            # directly here rather than via .bind(), which was unverified.
            format="json" if response_format == "json" else "",
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
