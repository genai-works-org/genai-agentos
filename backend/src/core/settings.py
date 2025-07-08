from functools import lru_cache
from typing import Optional, Self

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # JWT token params
    SECRET_KEY: str = Field(default="c41302ce0f1758f4ae5dcc65729fd50a")
    HASH_ALGORITHM: str = Field(default="HS256")

    # sqlalchemy echo, log level if needed
    DEBUG: bool = Field(default=False)

    # str type due to env vars values from .env are interpreted as strings
    POSTGRES_HOST: str = Field(default="genai-postgres")
    POSTGRES_USER: str = Field(default="postgres")
    POSTGRES_PASSWORD: str = Field(default="postgres")
    POSTGRES_DB: str = Field(default="postgres")
    POSTGRES_PORT: str = Field(default="5432")
    SQLALCHEMY_ASYNC_DATABASE_URI: Optional[str] = None

    ROUTER_WS_URL: str = Field(default="ws://genai-router:8080/ws")
    MASTER_BE_API_KEY: str = Field(
        default="7a3fd399-3e48-46a0-ab7c-0eaf38020283::master_server_be"
    )
    MASTER_AGENT_API_KEY: str = Field(
        default="e1adc3d8-fca1-40b2-b90a-7b48290f2d6a::master_server_ml"
    )
    BACKEND_CORS_ORIGINS: Optional[str] = Field(default="[*]")

    DEFAULT_FILES_FOLDER_NAME: str = Field(default="files")

    REDIS_BROKER_URI: str = Field(default="redis://genai-redis:6379/0")
    REDIS_BACKEND_URI: str = Field(default="redis://genai-redis:6379/0")

    CELERY_BEAT_INTERVAL_MINUTES: int = Field(default=1)

    GENAI_PROVIDER_URL: str = Field(default="https://proxy-openai.chi-6ec.workers.dev")

    @model_validator(mode="after")
    def build_database_uri(self) -> Self:
        if not self.SQLALCHEMY_ASYNC_DATABASE_URI:
            self.SQLALCHEMY_ASYNC_DATABASE_URI = (
                f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        return self

    def construct_sync_uri(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @field_validator("BACKEND_CORS_ORIGINS")
    def convert_cors_str_to_list(cls, env_var):
        if isinstance(env_var, str):
            if not env_var.startswith("[") and not env_var.endswith("]"):
                raise ValueError(
                    "BACKEND_CORS_ORIGINS environment variable must be spelled as python list, example: [*, http://localhost]"  # noqa: E501
                )
            cors_headers = (
                env_var.replace("[", "").replace("]", "").replace('"', "").split(",")
            )
            return cors_headers
        return env_var


@lru_cache
def get_settings():
    return Settings()
