from datetime import datetime
from enum import Enum
from typing import Optional, Union
from uuid import UUID

from pydantic import AnyHttpUrl, BaseModel, Field, field_validator


class AgentType(Enum):
    genai = "genai"
    flow = "flow"
    mcp = "mcp"
    a2a = "a2a"


class BaseUUIDToStrModel(BaseModel):
    id: Union[UUID, str]

    @field_validator("id")
    def cast_uuid_to_str(cls, v):
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


class AgentDTOWithJWT(BaseModel):
    id: Union[UUID, str]
    name: str
    description: str
    alias: str
    jwt: Optional[str] = None
    input_parameters: Union[dict, str]
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
