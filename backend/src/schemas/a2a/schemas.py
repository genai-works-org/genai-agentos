from datetime import datetime
from typing import Any, Optional

from pydantic import AnyHttpUrl, BaseModel, Field, ValidationError, field_validator

# The following models are the exact replicas of the a2a.types
# added for compatibility with agent cards
# listed here https://github.com/google/a2a-python/blob/main/src/a2a/types.py


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


class A2AAgentCardSchema(BaseModel):
    card: Optional[A2AAgentCard] = None
    is_active: bool


class A2ACreateAgentSchema(BaseModel):
    """
    Schema to handle FE requests to create a new A2A agent.
    This model is used to validate server url and start fetching the .well-known data from the a2a agent
    """

    server_url: AnyHttpUrl


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
