import json
from io import BytesIO
from urllib.error import HTTPError

import pytest

from app.services import email_service
from app.services.email_service import EmailDeliveryError, send_verification_code


class _FakeResponse:
    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self):
        return b'{"id": "email-id"}'


def _use_resend(monkeypatch, api_key="re_test_key"):
    monkeypatch.setattr(email_service.settings, "email_delivery_mode", "resend")
    monkeypatch.setattr(email_service.settings, "resend_api_key", api_key)
    monkeypatch.setattr(email_service.settings, "resend_from_email", "verify@example.com")
    monkeypatch.setattr(email_service.settings, "resend_from_name", "SRS Platform")


def test_resend_mode_posts_the_code_to_the_resend_api(monkeypatch):
    _use_resend(monkeypatch)
    captured = {}

    def fake_urlopen(request, timeout):
        captured["request"] = request
        return _FakeResponse()

    monkeypatch.setattr(email_service, "urlopen", fake_urlopen)

    send_verification_code(email="user@example.com", code="123456", full_name="Ada <Lovelace>")

    request = captured["request"]
    body = json.loads(request.data)
    assert request.full_url == "https://api.resend.com/emails"
    assert request.get_header("Authorization") == "Bearer re_test_key"
    assert body["from"] == "SRS Platform <verify@example.com>"
    assert body["to"] == ["user@example.com"]
    assert "123456" in body["text"]
    assert "123456" in body["html"]
    assert "&lt;Lovelace&gt;" in body["html"]


def test_resend_mode_requires_an_api_key(monkeypatch):
    _use_resend(monkeypatch, api_key=None)

    with pytest.raises(EmailDeliveryError):
        send_verification_code(email="user@example.com", code="123456", full_name="Ada")


def test_resend_api_error_raises_email_delivery_error(monkeypatch):
    _use_resend(monkeypatch)

    def fake_urlopen(request, timeout):
        raise HTTPError(request.full_url, 403, "Forbidden", {}, BytesIO(b'{"message": "bad domain"}'))

    monkeypatch.setattr(email_service, "urlopen", fake_urlopen)

    with pytest.raises(EmailDeliveryError):
        send_verification_code(email="user@example.com", code="123456", full_name="Ada")
