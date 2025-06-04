import logging
import traceback
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.exc import IntegrityError

from src.auth.dependencies import (
    CurrentUserByAgentOrUserTokenDependency,
    CurrentUserDependency,
)
from src.core.settings import get_settings
from src.db.session import AsyncDBSession
from src.repositories.agent import agent_repo
from src.repositories.flow import agentflow_repo
from src.schemas.api.agent.dto import AgentDTOWithJWT
from src.schemas.api.agent.schemas import AgentCRUDUpdate, AgentRegister
from src.utils.enums import ActiveAgentTypeFilter
from src.utils.filters import AgentFilter
from src.utils.helpers import (
    get_user_id_from_jwt,
    map_agent_model_to_dto,
    map_genai_agent_to_unified_dto,
)

settings = get_settings()
logger = logging.getLogger(__name__)
agent_router = APIRouter(tags=["agents"], prefix="/agents")


@agent_router.get(
    path="/active",
    summary="Get list of active agent connections",
)
async def get_active_connections(
    db: AsyncDBSession,
    authorization: Annotated[Optional[str], Header()] = None,
    x_api_key: Annotated[Optional[str], Header(convert_underscores=True)] = None,
    agent_type: ActiveAgentTypeFilter = Query(),
    user_id: Optional[UUID] = Query(None),
    offset: int = 0,
    limit: int = 100,
):
    if not any((user_id, authorization)):
        raise HTTPException(
            status_code=400,
            detail="You must provide either 'user_id' or your jwt token to continue.",
        )

    if all((authorization, x_api_key, user_id)):
        raise HTTPException(
            status_code=400,
            detail="You must provide either 'user_id' or your jwt token, but not both at the same time.",
        )

    if all((authorization, user_id)):
        raise HTTPException(
            status_code=400,
            detail="Lookup by user_id is not allowed for plain authenticated users.",
        )

    if not user_id and not authorization:
        if not x_api_key == settings.MASTER_BE_API_KEY:
            raise HTTPException(
                detail="You must provide x-api-key header if user_id query parameter is provided.",
                status_code=401,
            )
        user_id = get_user_id_from_jwt(token=authorization.split(" ")[-1])

    if authorization:
        user_id = get_user_id_from_jwt(token=authorization.split(" ")[-1])

    return await agent_repo.get_active_agents_by_filter(
        db=db, agent_type=agent_type, user_id=user_id, limit=limit, offset=offset
    )


@agent_router.get("/")
async def list_all_agents(
    db: AsyncDBSession,
    user: CurrentUserByAgentOrUserTokenDependency,
    offset: Optional[int] = 0,
    limit: int = 100,
    filter: AgentFilter = Depends(),
):
    result = await agent_repo.query_by_filter(
        db=db, user_model=user, filter_field=filter, offset=offset, limit=limit
    )
    if isinstance(result, list):
        return result

    return result


@agent_router.get("/{agent_id}")
async def get_data(
    db: AsyncDBSession,
    user: CurrentUserByAgentOrUserTokenDependency,
    agent_id: UUID,
):
    agent = await agent_repo.get_agent_by_id(db=db, agent_id=agent_id, user_model=user)

    if not agent:
        raise HTTPException(
            status_code=400, detail=f"Agent '{str(agent_id)}' does not exist"
        )
    return map_genai_agent_to_unified_dto(agent=agent)


@agent_router.post("/register", response_model=AgentDTOWithJWT)
async def register_agent(
    db: AsyncDBSession, user: CurrentUserDependency, agent_in: AgentRegister
):
    try:
        agent_with_token = await agent_repo.create_by_user(
            db=db, obj_in=agent_in, user_model=user
        )
        return agent_with_token
    except IntegrityError:
        logger.debug(traceback.format_exc())
        raise HTTPException(
            status_code=400, detail=f"Agent with {agent_in.id} already exists"
        )

    # if 400 is raised in agent_repo, catch and reraise here so it is not catched by 500 err response
    except HTTPException as e:
        raise e

    except Exception:
        logger.error(f"Unexpected error occured: {traceback.format_exc(limit=600)}")
        raise HTTPException(
            status_code=500, detail="Unexpected error occured, try again later."
        )


@agent_router.patch("/{agent_id}")
async def update_agent(
    db: AsyncDBSession,
    user: CurrentUserDependency,
    agent_id: UUID,
    agent_upd_data: AgentCRUDUpdate,
):
    agent = await agent_repo.get_agent_by_id(db=db, agent_id=agent_id, user_model=user)
    if not agent:
        raise HTTPException(
            status_code=400, detail=f"Agent '{str(agent_id)}' does not exist"
        )
    return map_agent_model_to_dto(agent=agent)


@agent_router.delete("/{agent_id}")
async def delete_agent(
    db: AsyncDBSession,
    user: CurrentUserDependency,
    agent_id: UUID,
):
    await agentflow_repo.delete_all_flows_where_deleted_agent_exists(
        db=db, agent_id=str(agent_id), user_model=user
    )
    is_ok = await agent_repo.delete(db=db, id_=str(agent_id))
    if not is_ok:
        raise HTTPException(status_code=400, detail=f"Agent {agent_id} was not found")

    return Response(status_code=204)
