from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "SRS Diagram Platform"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = "change-this-development-secret"
    access_token_expire_minutes: int = 60
    password_reset_token_expire_minutes: int = 15
    email_delivery_mode: str = "console"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str = "no-reply@srs-platform.local"
    smtp_from_name: str = "SRS Diagram Platform"
    smtp_use_tls: bool = True
    email_verification_code_expire_minutes: int = 10
    email_verification_resend_cooldown_seconds: int = 60
    llm_provider: str = "openai"
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.6"
    openai_models: str = "gpt-5.6,gpt-5.6-sol,gpt-5.6-terra,gpt-5.6-luna,gpt-5.5,gpt-5.5-2026-04-23,gpt-5.4,gpt-5.4-2026-03-05,gpt-5.4-pro,gpt-5.4-mini,gpt-5.2,gpt-4.1,gpt-4.1-mini,gpt-4.1-nano,gpt-4o,gpt-4o-mini"
    anthropic_model: str = "claude-sonnet-5"
    anthropic_models: str = "claude-fable-5,claude-opus-5,claude-sonnet-5,claude-haiku-4-5-20251001,claude-opus-4-8,claude-opus-4-7,claude-opus-4-6,claude-sonnet-4-6"
    gemini_model: str = "gemini-3.6-flash"
    gemini_models: str = "gemini-3.6-flash,gemini-3.5-flash,gemini-3.5-flash-lite,gemini-3.1-pro-preview,gemini-3.1-flash-lite,gemini-3-flash-preview,gemini-2.5-pro,gemini-2.5-flash,gemini-2.5-flash-lite"
    openai_temperature: float = 0
    openai_timeout_seconds: int = 20
    openai_max_retries: int = 0
    ai_credential_encryption_key: str = "change-this-development-ai-credential-key"
    srsgen_base_model: str = "Qwen/Qwen1.5-1.8B-Chat"
    srsgen_artifact_path: str = "model_artifacts/srsgen-qwen1.5"
    srsgen_load_in_4bit: bool = True
    srsgen_max_new_tokens: int = 2048
    srsgen_temperature: float = 0
    backend_cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="BACKEND_CORS_ORIGINS",
    )
    database_url: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/srs_diagram_platform",
        alias="DATABASE_URL",
    )
    super_admin_email: str | None = None
    super_admin_password: str | None = None
    super_admin_full_name: str = "Platform Super Admin"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]

    def provider_models(self, provider: str) -> list[str]:
        raw = {
            "openai": self.openai_models,
            "anthropic": self.anthropic_models,
            "gemini": self.gemini_models,
        }.get(provider, "")
        return list(dict.fromkeys(model.strip() for model in raw.split(",") if model.strip()))

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8-sig",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
