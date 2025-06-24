from datetime import datetime
from enum import Enum
from typing import Any, Optional, Union
from uuid import UUID

from pydantic import (
    AnyHttpUrl,
    BaseModel,
    ConfigDict,
    Field,
    ValidationError,
    field_validator,
)


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

    id: Optional[UUID | str] = None
    model_config = ConfigDict(extra="forbid")

    name: str  # alias
    type: AgentType
    url: Optional[AnyHttpUrl] = None
    agent_schema: Optional[dict | list[dict]] = None
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
    created_at: str
    # = Field(default_factory=datetime.now)
    updated_at: str
    # = Field(default_factory=datetime.now)


class A2AAgentCapabilities(BaseModel):
    pushNotifications: Optional[bool] = None
    stateTransitionHistory: Optional[bool] = None
    streaming: Optional[bool] = None


class A2AAgentProvider(BaseModel):
    organization: str
    url: str


class A2AAgentSkill(BaseModel):
    id: str
    name: str
    description: str
    examples: list[str] | None = None
    inputModes: list[str] | None = None
    outputModes: list[str] | None = None
    tags: list[str] = []

    @field_validator("name")
    def replace_whitespaces_with_underscores(cls, v: str):
        return v.replace(" ", "_")


class A2AAgentCard(BaseModel):
    name: str
    description: str
    provider: Optional[A2AAgentProvider] = None
    defaultInputModes: list[str]
    defaultOutputModes: list[str]
    documentationUrl: Optional[str] = None
    security: Optional[list[dict[str, list[str]]]] = None
    securitySchemes: Optional[dict[str, Any]] = None
    skills: list[A2AAgentSkill]
    supportsAuthenticatedExtendedCard: Optional[bool] = None
    url: str
    version: str
    capabilities: A2AAgentCapabilities

    @field_validator("url")
    def validate_url(cls, v: str):
        try:
            # in pydantic 2 anyhttpurl returns URL obj, which needs to be cast to str
            url = AnyHttpUrl(url=v)
            return str(url)[:-1]  # strip trailing slash
        except ValidationError:
            return v

    @field_validator("name")
    def replace_whitespace_with_underscore(cls, v: str):
        return v.replace(" ", "_")


class A2AJsonSchema(BaseModel):
    """
    Model to structure adjusted A2A agent schema without the a2a agent skills
    """

    title: str
    description: str
    properties: dict[str, Any] = Field(
        default={
            "task": {
                "type": "string",
                "description": "A meaningful, well-formulated task for the agent",
            },
            "text": {"type": "string"},
        },
    )
    required: list[Optional[str]] = Field(default=["task", "text"])
    type: Optional[str] = Field(default="object")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class MCPToolDTO(BaseUUIDToStrModel):
    name: str
    description: Optional[str] = None
    alias: Optional[str] = None
    inputSchema: dict
    annotations: Optional[dict] = None
    mcp_server_id: str | UUID

    @field_validator("mcp_server_id")
    def cast_to_uuid(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v
