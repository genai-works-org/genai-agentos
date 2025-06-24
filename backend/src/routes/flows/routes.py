from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from src.auth.dependencies import CurrentUserDependency
from src.db.session import AsyncDBSession
from src.repositories.flow import agentflow_repo
from src.schemas.api.flow.dto import AgentFlowDTO
from src.schemas.api.flow.schemas import AgentFlowCreate, AgentFlowUpdate

flow_router = APIRouter(tags=["agentflows"], prefix="/agentflows")


@flow_router.get("/", response_model=list[AgentFlowDTO])
async def list_all_agentflows(
    db: AsyncDBSession,
    user: CurrentUserDependency,
    offset: Optional[int] = 0,
    limit: int = 100,
):
    # TODO: pagination
    return await agentflow_repo.get_all_flows_and_validate_all_flow_agents(
        db=db, user_model=user, offset=offset, limit=limit
    )


@flow_router.get("/{agentflow_id}", response_model=AgentFlowDTO)
async def get_agentflow_data(
    db: AsyncDBSession, user: CurrentUserDependency, agentflow_id: UUID
):
    agentflow = await agentflow_repo.get_flow_and_validate_all_flow_agents(
        db=db, flow_id=agentflow_id, user_model=user
    )
    return agentflow


@flow_router.post("/register")
async def register_agentflow(
    db: AsyncDBSession,
    user: CurrentUserDependency,
    agentflow_in: AgentFlowCreate,
):
    await agentflow_repo.validate_all_agents_in_flow_are_active(
        obj_in=agentflow_in, user_model=user
    )
    result = await agentflow_repo.create_by_user(
        db=db, obj_in=agentflow_in, user_model=user
    )
    return result


@flow_router.patch("/{agentflow_id}")
async def update_agentflow(
    db: AsyncDBSession,
    user: CurrentUserDependency,
    agentflow_id: UUID,
    agentflow_upd_data: AgentFlowUpdate,
):
    agentflow = await agentflow_repo.update_flow(
        db=db, flow_id=agentflow_id, upd_data=agentflow_upd_data, user_model=user
    )
    if not agentflow:
        raise HTTPException(
            status_code=400, detail=f"Agentflow with ID '{agentflow_id}' was not found"
        )

    return agentflow


@flow_router.delete("/{agentflow_id}")
async def delete_agentflow(
    db: AsyncDBSession,
    user: CurrentUserDependency,
    agentflow_id: UUID,
):
    is_ok = await agentflow_repo.delete_by_user(db=db, id_=str(agentflow_id), user=user)
    if not is_ok:
        raise HTTPException(
            status_code=400, detail=f"agentflow {agentflow_id} was not found"
        )

    return Response(status_code=204)
