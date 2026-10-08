import pytest

from app.core.config import settings


@pytest.fixture(autouse=True)
def console_email_delivery(monkeypatch: pytest.MonkeyPatch) -> None:
    """Keep tests off real mail providers, whatever the local .env selects."""
    monkeypatch.setattr(settings, "email_delivery_mode", "console")


@pytest.fixture(autouse=True)
def rag_off_by_default(monkeypatch: pytest.MonkeyPatch) -> None:
    """Correction memory stays off unless a test turns it on, whatever the local .env says."""
    monkeypatch.setattr(settings, "rag_enabled", False)


@pytest.fixture(autouse=True)
def no_hosted_gemini_by_default(monkeypatch: pytest.MonkeyPatch) -> None:
    """Hosted AI stays on OpenRouter unless a test sets a Gemini key, whatever the local .env says."""
    monkeypatch.setattr(settings, "gemini_api_key", None)
