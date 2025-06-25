from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from src.schemas.a2a.schemas import A2AAgentCard, A2AJsonSchema
from src.schemas.base import BaseUUIDToStrModel
from src.utils.enums import AgentType


class A2ACardDTO(BaseUUIDToStrModel):
    name: str
    alias: Optional[str] = None
    description: str
    server_url: str
    # dict type is due to {} being a default value for the json field in DB
    card_content: Optional[A2AAgentCard | dict] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ActiveA2ACardDTO(BaseModel):
    type: AgentType = Field(default=AgentType.a2a)
    # server_url: str
    created_at: datetime
    updated_at: datetime
    agent_schema: A2AAgentCard


class A2ACardJsonSchema(BaseModel):
    type: AgentType = Field(default=AgentType.a2a)
    url: str
    agent_schema: A2AJsonSchema


class A2AFirstAgentInFlow(BaseModel):
    name: str
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
    required: list[Optional[str]] = ["task", "text"]
    type: str = Field(default="object")
