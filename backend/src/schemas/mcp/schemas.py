from typing import Any, Literal, Optional

from mcp.types import Tool
from pydantic import AnyHttpUrl, BaseModel


class BaseMCP(BaseModel):
    meta: Optional[Any] = None
    nextCursor: Optional[Any] = None


class MCPToolAnnotation(BaseModel):
    title: Optional[str] = None
    readOnlyHint: Optional[bool] = None
    destructiveHint: Optional[bool] = None
    idempotentHint: Optional[bool] = None
    openWorldHint: Optional[bool] = None


class MCPToolInputSchema(BaseModel):
    type: Literal["object"] = "object"
    properties: dict[str, Any]


class MCPToolSchema(BaseModel):
    name: str
    description: Optional[str] = None
    inputSchema: MCPToolInputSchema
    annotations: Optional[MCPToolAnnotation]


class MCPResourceSchema(BaseModel):
    uri: str
    name: str
    description: Optional[str]
    mimeType: Optional[str]


class MCPPromptArgument(BaseModel):
    name: str
    description: Optional[str]
    required: bool


class MCPPromptSchema(BaseModel):
    name: str
    description: Optional[str]
    arguments: Optional[list[MCPPromptArgument]]


class MCPServerData(BaseModel):
    mcp_tools: list[Optional[Tool]] = []
    is_active: bool
    meta: Optional[Any] = None
    nextCursor: Optional[Any] = None
    server_url: Optional[str] = None


class MCPCreateServer(BaseModel):
    """
    Schema to handle FE requests to create a new MCP server.
    This model is used to validate server url and looking up the
    """

    server_url: AnyHttpUrl
