from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator
from src.schemas.api.model_config.schemas import ModelConfigBase, ModelProviderBase
from src.schemas.base import BaseUUIDToStrModel
from src.utils.constants import DEFAULT_SYSTEM_PROMPT


class ModelConfigDTO(ModelConfigBase, BaseUUIDToStrModel):
    system_prompt: Optional[str] = Field(default=DEFAULT_SYSTEM_PROMPT)
    user_prompt: Optional[str] = None
    max_last_messages: Optional[int] = Field(default=5)

    @field_validator("system_prompt")
    def return_default_system_prompt(cls, v):
        if not v:
            return DEFAULT_SYSTEM_PROMPT
        return v


class ModelPromptDTO(BaseModel):
    # TODO: model and provider
    system_prompt: Optional[str] = Field(default=DEFAULT_SYSTEM_PROMPT.lstrip("\n"))

    @field_validator("system_prompt")
    def return_default_system_prompt(cls, v):
        if not v:
            return DEFAULT_SYSTEM_PROMPT.lstrip("\n")
        return v


class ModelProviderDTO(ModelProviderBase):
    provider: str
    configs: list[ModelConfigDTO]
    provider_metadata: Optional[dict] = Field(default={}, alias="metadata")


class ModelProviderCreateDTO(ModelProviderBase, BaseUUIDToStrModel):
    provider: str
    metadata: Optional[dict] = {}

    created_at: datetime
    updated_at: datetime


class ModelProviderUpdateDTO(ModelProviderCreateDTO):
    pass


class GenAIProviderDTO(BaseModel):
    name: str
    api_key: Optional[str] = Field(default=None)
    base_url: Optional[str] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # @model_validator(mode="after")
    # def validate_url(self) -> Self:
