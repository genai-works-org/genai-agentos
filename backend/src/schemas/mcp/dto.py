from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from src.schemas.base import BaseUUIDToStrModel
from src.utils.enums import AgentType


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


class MCPServerDTO(BaseModel):
    server_url: str
    mcp_tools: list[dict] | list[MCPToolDTO]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ActiveMCPToolDTO(BaseModel):
    type: AgentType = Field(default=AgentType.mcp)
    created_at: datetime
    updated_at: datetime
    agent_schema: dict
