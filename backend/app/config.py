from __future__ import annotations

from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    App settings loaded from environment variables.

    Notes:
    - In local dev, you can copy `.env.example` to `.env` and fill values.
    - `CORS_ORIGINS` accepts a comma-separated list (e.g. "http://localhost:3000,http://127.0.0.1:3000").
    """

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # External integrations
    OPENAI_API_KEY: str | None = None
    COMPOSIO_API_KEY: str | None = None
    COMPOSIO_USER_ID: str | None = None
    YOUCOM_API_KEY: str | None = None
    NOTION_DATABASE_ID: str | None = None

    # App / infra
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"
    CORS_ORIGINS: str = Field(default="http://localhost:3000,http://127.0.0.1:3000")

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


def get_settings() -> Settings:
    # Small helper so routers/services can `from app.config import get_settings`
    return Settings()

