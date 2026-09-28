import io
import json
from urllib.error import HTTPError

import pytest

from app.core.config import settings
from app.services import hosted_ai_service
from app.services.hosted_ai_service import HostedAiClient, hosted_ai_available
from app.services.llm_service import LlmConfigurationError, LlmExecutionError, LlmRequest


class _FakeResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


def _ok(payload: dict) -> _FakeResponse:
    return _FakeResponse(json.dumps(payload).encode("utf-8"))


def _http_error(code: int, message: str) -> HTTPError:
    body = io.BytesIO(json.dumps({"error": {"message": message}}).encode("utf-8"))
    return HTTPError("https://example.test", code, message, {}, body)


@pytest.fixture(autouse=True)
def _configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "openrouter_api_key", "test-key")
    monkeypatch.setattr(settings, "openrouter_model", "vendor/model-a")
    monkeypatch.setattr(settings, "openrouter_fallback_models", "vendor/model-b")
    monkeypatch.setattr(settings, "openrouter_max_retries", 1)
    monkeypatch.setattr(hosted_ai_service.time, "sleep", lambda seconds: None)


def test_generate_sends_json_mode_and_fallbacks(monkeypatch: pytest.MonkeyPatch) -> None:
    sent: list[dict] = []

    def fake_urlopen(request, timeout):
        sent.append(json.loads(request.data))
        assert request.headers["Authorization"] == "Bearer test-key"
        return _ok(
            {
                "model": "vendor/model-a",
                "choices": [{"message": {"content": '{"ok": true}'}, "finish_reason": "stop"}],
                "usage": {"prompt_tokens": 12, "completion_tokens": 3},
            }
        )

    monkeypatch.setattr(hosted_ai_service, "urlopen", fake_urlopen)
    response = HostedAiClient().generate(LlmRequest(prompt="hi", purpose="test", response_format="json"))

    assert response.content == '{"ok": true}'
    assert response.prompt_tokens == 12 and response.completion_tokens == 3
    assert response.response_payload["provider"] == "ai"
    assert sent[0]["response_format"] == {"type": "json_object"}
    assert sent[0]["models"] == ["vendor/model-a", "vendor/model-b"]


def test_json_mode_is_dropped_when_model_rejects_it(monkeypatch: pytest.MonkeyPatch) -> None:
    sent: list[dict] = []

    def fake_urlopen(request, timeout):
        body = json.loads(request.data)
        sent.append(body)
        if "response_format" in body:
            raise _http_error(400, "response_format not supported")
        return _ok({"choices": [{"message": {"content": "plain"}}]})

    monkeypatch.setattr(hosted_ai_service, "urlopen", fake_urlopen)
    response = HostedAiClient().generate(LlmRequest(prompt="hi", purpose="test", response_format="json"))

    assert response.content == "plain"
    assert len(sent) == 2 and "response_format" not in sent[1]


def test_rate_limit_is_retried_then_reported_without_vendor_name(monkeypatch: pytest.MonkeyPatch) -> None:
    calls = 0

    def fake_urlopen(request, timeout):
        nonlocal calls
        calls += 1
        raise _http_error(429, "OpenRouter: rate limited")

    monkeypatch.setattr(hosted_ai_service, "urlopen", fake_urlopen)
    with pytest.raises(LlmExecutionError) as excinfo:
        HostedAiClient().generate(LlmRequest(prompt="hi", purpose="test"))

    assert calls == 2
    assert "openrouter" not in str(excinfo.value).lower()


def test_error_messages_never_name_the_vendor(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(hosted_ai_service, "urlopen", lambda request, timeout: (_ for _ in ()).throw(_http_error(422, "OpenRouter says no")))
    with pytest.raises(LlmExecutionError) as excinfo:
        HostedAiClient().generate(LlmRequest(prompt="hi", purpose="test"))
    assert "openrouter" not in str(excinfo.value).lower()


def test_unconfigured_client_is_unavailable(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "openrouter_api_key", None)
    assert hosted_ai_available() is False
    with pytest.raises(LlmConfigurationError) as excinfo:
        HostedAiClient().validate_configuration()
    assert "openrouter" not in str(excinfo.value).lower()
