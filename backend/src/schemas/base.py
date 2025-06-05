from datetime import datetime
from typing import Optional, Union
from uuid import UUID

from pydantic import AnyHttpUrl, BaseModel, field_validator

from src.utils.enums import AgentType


class BaseUUIDToStrModel(BaseModel):
    id: Union[UUID, str]

    @field_validator("id")
    def cast_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v


class CastSessionIDToStrModel(BaseModel):
    session_id: Optional[str | UUID] = None

    @field_validator("session_id")
    def cast_session_id_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v


class AgentDTOPayload(BaseUUIDToStrModel):
    """
    Unified DTO model for all of the resources in the platform - genai agents, flows, mcp, a2a
    """

    name: str  # alias
    type: AgentType
    url: Optional[AnyHttpUrl] = None
    agent_schema: dict
    flow: Optional[list] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_active: Optional[bool] = None
