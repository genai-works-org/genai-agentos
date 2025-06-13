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
    system_prompt: Optional[str] = Field(default=DEFAULT_SYSTEM_PROMPT)

    @field_validator("system_prompt")
    def return_default_system_prompt(cls, v):
        if not v:
            return DEFAULT_SYSTEM_PROMPT
        return v


class ModelProviderDTO(ModelProviderBase):
    name: str
    configs: list[ModelConfigDTO]
