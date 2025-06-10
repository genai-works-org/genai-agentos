import json
from uuid import UUID

from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from src.auth.dependencies import CurrentUserDependency
from src.db.session import AsyncDBSession
from src.repositories.a2a import a2a_repo
from src.schemas.a2a.schemas import A2ACreateAgentSchema

a2a_router = APIRouter(tags=["a2a"], prefix="/a2a")


@a2a_router.post("/agents")
async def add_agent_url(
    db: AsyncDBSession,
    user_model: CurrentUserDependency,
    data_in: A2ACreateAgentSchema,
):
    try:
        return await a2a_repo.add_url(db=db, user_model=user_model, data_in=data_in)
    except ValidationError as e:
        return JSONResponse(content=json.loads(e.json()), status_code=400)


@a2a_router.get("/agents")
async def list_all_agent_cards(db: AsyncDBSession, user_model: CurrentUserDependency):
    cards = await a2a_repo.get_multiple_by_user(db=db, user_model=user_model)
    return cards


@a2a_router.get("/agents/{agent_id}")
async def get_agent_card(
    db: AsyncDBSession, user_model: CurrentUserDependency, agent_id: UUID
):
    card = await a2a_repo.get_by_user(db=db, id_=agent_id, user_model=user_model)
    if not card:
        raise HTTPException(
            detail=f"A2A agent with id: '{agent_id}' does not exist ", status_code=400
        )
    return card


@a2a_router.delete("/agents/{agent_id}")
async def delete_mcp_server(
    db: AsyncDBSession, user_model: CurrentUserDependency, agent_id: UUID
):
    is_ok = await a2a_repo.delete_by_user(db=db, user=user_model, id_=agent_id)
    if not is_ok:
        raise HTTPException(
            status_code=400, detail=f"MCP server with ID {str(agent_id)} was not found"
        )

    return Response(status_code=204)
