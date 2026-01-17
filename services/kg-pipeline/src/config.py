"""Configuration management for the kg-pipeline service.

Uses pydantic-settings for type-safe environment variable loading.
"""

from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


def _get_env_files() -> tuple[str, ...]:
    """Get env file paths: monorepo root first, then service directory."""
    service_root = Path(__file__).parent.parent
    monorepo_root = service_root.parent.parent
    return (
        str(monorepo_root / ".env"),  # /math/.env (primary)
        str(service_root / ".env"),    # /math/services/kg-pipeline/.env (fallback)
    )


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=_get_env_files(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # OpenAI Configuration
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    # Neo4j Configuration
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str = ""
    neo4j_database: str = "neo4j"

    # Mathpix Configuration
    mathpix_app_id: str = ""
    mathpix_app_key: str = ""
    mathpix_api_url: str = "https://api.mathpix.com/v3"

    # Data Paths (relative to service root)
    data_inbox_path: str = "data/inbox"
    data_archive_path: str = "data/archive"
    data_error_path: str = "data/error"

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # Processing Configuration
    max_concurrent_files: int = 3
    mathpix_timeout_seconds: int = 120

    @property
    def service_root(self) -> Path:
        """Get the kg-pipeline service root directory."""
        return Path(__file__).parent.parent

    @property
    def inbox_path(self) -> Path:
        """Get the full inbox path."""
        return self.service_root / self.data_inbox_path

    @property
    def archive_path(self) -> Path:
        """Get the full archive path."""
        return self.service_root / self.data_archive_path

    @property
    def error_path(self) -> Path:
        """Get the full error path."""
        return self.service_root / self.data_error_path

    def validate_api_keys(self) -> dict[str, bool]:
        """Check which API keys are configured."""
        return {
            "openai": bool(self.openai_api_key),
            "neo4j": bool(self.neo4j_password),
            "mathpix": bool(self.mathpix_app_id and self.mathpix_app_key),
        }


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
