import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from src.auth.dependencies import CurrentUserDependency
from src.db.session import AsyncDBSession
from src.repositories.mcp import mcp_repo
from src.schemas.mcp.schemas import MCPCreateServer

mcp_router = APIRouter(tags=["mcp"], prefix="/mcp")


@mcp_router.post("/url")
async def add_server_url(
    db: AsyncDBSession, user_model: CurrentUserDependency, data_in: MCPCreateServer
):
    try:
        if not str(data_in.server_url).endswith("/sse"):
            raise HTTPException(
                detail="MCP server address must contain /sse endpoint. Example: http://example.com/sse",
                status_code=400,
            )
        return await mcp_repo.add_url(db=db, user_model=user_model, data_in=data_in)
    except ValidationError as e:
        return JSONResponse(content=json.loads(e.json()), status_code=400)
