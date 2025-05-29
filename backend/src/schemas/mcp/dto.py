from datetime import datetime

from pydantic import BaseModel, Field

from src.utils.enums import AgentType


class MCPServerDTO(BaseModel):
    server_url: str
    mcp_tools: list[dict]
    mcp_prompts: list[dict]
    mcp_resources: list[dict]
    is_active: bool


class ActiveMCPServerDTO(MCPServerDTO):
    type: AgentType = Field(default=AgentType.mcp)
    created_at: datetime
    updated_at: datetime
