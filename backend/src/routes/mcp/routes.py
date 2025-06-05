import json
from uuid import UUID

from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from src.auth.dependencies import CurrentUserDependency
from src.db.session import AsyncDBSession
from src.repositories.mcp import mcp_repo
from src.schemas.mcp.schemas import MCPCreateServer

mcp_router = APIRouter(tags=["mcp"], prefix="/mcp")


@mcp_router.post("/servers")
async def add_server_url(
    db: AsyncDBSession, user_model: CurrentUserDependency, data_in: MCPCreateServer
):
    try:
        return await mcp_repo.add_url(db=db, user_model=user_model, data_in=data_in)
    except ValidationError as e:
        return JSONResponse(content=json.loads(e.json()), status_code=400)


@mcp_router.get("/servers")
async def list_all_mcp_servers(
    db: AsyncDBSession,
    user_model: CurrentUserDependency,
    limit: int = 100,
    offset: int = 0,
):
    return await mcp_repo.get_all_mcp_tools_of_all_servers(
        db=db, user_model=user_model, limit=limit, offset=offset
    )


@mcp_router.get("/servers/{server_id}")
async def get_mcp_server(
    db: AsyncDBSession, user_model: CurrentUserDependency, server_id: UUID
):
    return await mcp_repo.get_all_mcp_tools_from_single_server(
        db=db, id_=server_id, user_model=user_model
    )


@mcp_router.delete("/servers/{server_id}")
async def delete_mcp_server(
    db: AsyncDBSession, user_model: CurrentUserDependency, server_id: UUID
):
    is_ok = await mcp_repo.delete_by_user(db=db, user=user_model, id_=server_id)
    if not is_ok:
        raise HTTPException(
            status_code=400, detail=f"MCP server with ID {str(server_id)} was not found"
        )

    return Response(status_code=204)
