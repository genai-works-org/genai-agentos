from datetime import datetime

from pydantic import BaseModel, Field

from src.utils.enums import AgentType


class MCPServerDTO(BaseModel):
    server_url: str
    mcp_tools: list[dict]
    is_active: bool


class ActiveMCPToolDTO(BaseModel):
    type: AgentType = Field(default=AgentType.mcp)
    created_at: datetime
    updated_at: datetime
    agent_schema: dict
