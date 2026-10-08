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


def test_a_400_that_is_not_about_json_mode_keeps_the_hint_and_is_not_retried(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Dropping response_format only helps a model that rejected JSON mode. On any
    other 400 it would spend a second doomed call and lose the JSON hint."""
    sent: list[dict] = []

    def fake_urlopen(request, timeout):
        sent.append(json.loads(request.data))
        raise _http_error(400, "max_tokens is greater than the context window")

    monkeypatch.setattr(hosted_ai_service, "urlopen", fake_urlopen)
    with pytest.raises(LlmExecutionError) as excinfo:
        HostedAiClient().generate(LlmRequest(prompt="hi", purpose="test", response_format="json"))

    assert len(sent) == 1 and "response_format" in sent[0]
    assert "context window" in str(excinfo.value)


def test_an_error_served_with_http_200_is_retried_like_a_5xx(monkeypatch: pytest.MonkeyPatch) -> None:
    calls = 0

    def fake_urlopen(request, timeout):
        nonlocal calls
        calls += 1
        if calls == 1:
            return _ok({"error": {"message": "OpenRouter: upstream model is offline"}})
        return _ok({"choices": [{"message": {"content": "second time lucky"}}]})

    monkeypatch.setattr(hosted_ai_service, "urlopen", fake_urlopen)
    response = HostedAiClient().generate(LlmRequest(prompt="hi", purpose="test"))

    assert calls == 2
    assert response.content == "second time lucky"


def test_an_error_served_with_http_200_is_reported_without_the_vendor(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        hosted_ai_service,
        "urlopen",
        lambda request, timeout: _ok({"error": {"message": "OpenRouter: vendor/model-a is offline"}}),
    )
    with pytest.raises(LlmExecutionError) as excinfo:
        HostedAiClient().generate(LlmRequest(prompt="hi", purpose="test"))

    message = str(excinfo.value)
    assert "openrouter" not in message.lower()
    assert "vendor/model-a" not in message


def test_a_truncated_answer_fails_instead_of_passing_half_an_artifact_on(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        hosted_ai_service,
        "urlopen",
        lambda request, timeout: _ok(
            {"choices": [{"message": {"content": '{"classes": [{"name": "Bo'}, "finish_reason": "length"}]}
        ),
    )
    with pytest.raises(LlmExecutionError) as excinfo:
        HostedAiClient().generate(LlmRequest(prompt="hi", purpose="test", response_format="json"))
    assert "ran out of room" in str(excinfo.value)


def test_the_platform_key_is_never_echoed_back_to_the_user(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        hosted_ai_service,
        "urlopen",
        # 422 is reported with the upstream detail attached, which is exactly
        # where a quoted-back credential would surface.
        lambda request, timeout: (_ for _ in ()).throw(_http_error(422, "rejected header Bearer test-key")),
    )
    with pytest.raises(LlmExecutionError) as excinfo:
        HostedAiClient().generate(LlmRequest(prompt="hi", purpose="test"))
    message = str(excinfo.value)
    assert "rejected header" in message and "test-key" not in message


def test_fallbacks_come_from_the_dedicated_setting_not_the_byok_provider_list() -> None:
    client = HostedAiClient()
    assert settings.openrouter_models == ["vendor/model-a", "vendor/model-b"]
    assert client.fallback_models == ["vendor/model-b"]
    # The hosted vendor is not a provider a user can pick in AI Settings.
    assert settings.provider_models("openrouter_fallback") == []


def _gemini_ok(text: str, **extra) -> _FakeResponse:
    return _ok(
        {
            "candidates": [
                {
                    "content": {"parts": [{"text": "thinking...", "thought": True}, {"text": text}]},
                    "finishReason": "STOP",
                }
            ],
            "usageMetadata": {"promptTokenCount": 9, "candidatesTokenCount": 4, "thoughtsTokenCount": 2},
            **extra,
        }
    )


def test_gemini_leads_when_its_key_is_set(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "gemini_api_key", "gemini-key")
    monkeypatch.setattr(settings, "gemini_hosted_model", "gemini-test")
    sent: list[tuple[str, dict, dict]] = []

    def fake_urlopen(request, timeout):
        sent.append((request.full_url, dict(request.header_items()), json.loads(request.data)))
        return _gemini_ok('{"ok": true}')

    monkeypatch.setattr(hosted_ai_service, "urlopen", fake_urlopen)
    client = HostedAiClient()
    response = client.generate(LlmRequest(prompt="hi", purpose="test", response_format="json"))

    url, headers, body = sent[0]
    assert url.endswith("/models/gemini-test:generateContent")
    assert headers["X-goog-api-key"] == "gemini-key"
    assert "key=" not in url
    assert body["contents"][0]["parts"][0]["text"] == "hi"
    assert body["generationConfig"]["responseMimeType"] == "application/json"
    assert response.content == '{"ok": true}'  # the thought part is left out
    assert response.prompt_tokens == 9 and response.completion_tokens == 6
    assert client.model_name == "gemini-test"


def test_gemini_failure_falls_back_to_openrouter(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "gemini_api_key", "gemini-key")
    calls: list[str] = []

    def fake_urlopen(request, timeout):
        calls.append(request.full_url)
        if "generateContent" in request.full_url:
            raise _http_error(429, "Resource has been exhausted")
        return _ok({"choices": [{"message": {"content": "from openrouter"}, "finish_reason": "stop"}]})

    monkeypatch.setattr(hosted_ai_service, "urlopen", fake_urlopen)
    client = HostedAiClient()
    response = client.generate(LlmRequest(prompt="hi", purpose="test"))

    assert response.content == "from openrouter"
    assert client.model_name == "vendor/model-a"
    assert any("generateContent" in url for url in calls) and calls[-1].endswith("/chat/completions")


def test_gemini_alone_is_enough_and_its_errors_surface(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "openrouter_api_key", None)
    monkeypatch.setattr(settings, "gemini_api_key", "gemini-key")
    assert hosted_ai_available()

    monkeypatch.setattr(
        hosted_ai_service, "urlopen", lambda request, timeout: _ok({"candidates": [{"content": {"parts": []}, "finishReason": "MAX_TOKENS"}]})
    )
    with pytest.raises(LlmExecutionError, match="ran out of room"):
        HostedAiClient().generate(LlmRequest(prompt="hi", purpose="test"))


def test_no_key_at_all_means_unavailable(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "openrouter_api_key", None)
    assert not hosted_ai_available()
    with pytest.raises(LlmConfigurationError):
        HostedAiClient().validate_configuration()
