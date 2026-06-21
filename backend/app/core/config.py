from functools import lru_cache

from pydantic import PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "SRS Diagram Platform"
    api_v1_prefix: str = "/api/v1"
    database_url: PostgresDsn = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/srs_diagram_platform"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
