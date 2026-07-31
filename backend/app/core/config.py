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
    llm_provider: str = "auto"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    openai_temperature: float = 0
    openai_timeout_seconds: int = 30
    openai_max_retries: int = 2
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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8-sig",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
