from pathlib import Path

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    database_url: str = "postgresql+psycopg://llm_dev:local_dev_only_change_me@127.0.0.1:5432/llm_dev"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    session_cookie_secure: bool = False
    session_lifetime_seconds: int = Field(default=604800, ge=300, le=2592000)
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "qwen3.5:2b-q4_K_M"
    ollama_context_tokens: int = Field(default=2048, ge=256, le=131072)
    ollama_max_output_tokens: int = Field(default=256, ge=1, le=8192)
    ollama_temperature: float = Field(default=0.2, ge=0, le=2)

    @model_validator(mode="after")
    def require_secure_production_cookies(self) -> "Settings":
        if self.app_env == "production" and not self.session_cookie_secure:
            raise ValueError("Production requires SESSION_COOKIE_SECURE=true and HTTPS")
        return self

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

