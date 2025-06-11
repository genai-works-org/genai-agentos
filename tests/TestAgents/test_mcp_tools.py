import pytest
from mcp.server import FastMCP


@pytest.mark.asyncio
async def test_mcp_server_tool_exists(mcp_server: FastMCP):
    tools = await mcp_server.list_tools()
    assert len(tools) == 1
