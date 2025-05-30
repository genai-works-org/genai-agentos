from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models import Agent, User
from src.repositories.agent import agent_repo
from src.repositories.flow import agentflow_repo
from src.schemas.api.agent.dto import MLAgentSchema
from src.schemas.api.flow.schemas import FlowSchema
from src.schemas.ws.dto.response import AgentAndFlowsDTO


async def validate_all_agents_are_active_within_flow(
    db: AsyncSession, flow: list[Optional[dict[str, Any]]]
) -> bool:
    agent_ids = [agent["agent_id"] for agent in flow]
    q = await db.execute(select(Agent.is_active).where(Agent.id.in_(agent_ids)))
    return all(q.scalars().all())


async def query_agents_and_flows(
    db: AsyncSession,
    user_model: User,
    limit: int = 100,
    offset: int = 0,
) -> AgentAndFlowsDTO:
    """
        Queries agents and associated flows, transforming them into a format suitable for
    machine learning applications.

        Args:
            db: The database session.
            limit: The maximum number of agents and flows to retrieve (default: 100).
            offset: The starting offset for pagination (default: 0).

        Returns:
            An AgentAndFlowsDTO object containing a list of transformed agents and flows.

        Note:
            Transforms agents and associated flows, including extracting the input schema
    from the first agent of each flow.
            The existence of agents within flows is assumed to be validated during
    creation.
    """
    agents = []
    for agent in await agent_repo.get_multiple_by_user(
        db=db, user_model=user_model, offset=offset, limit=limit
    ):
        if agent:
            if agent.is_active:
                schema = MLAgentSchema(
                    agent_id=str(agent.id),
                    agent_name=agent.name,
                    agent_description=agent.description,
                    agent_input_schema=agent.input_parameters,
                )
                agents.append(schema)

    for flow in await agentflow_repo.get_multiple_by_user(
        db=db, user_model=user_model, offset=offset, limit=limit
    ):
        all_agents_active = await validate_all_agents_are_active_within_flow(
            db=db, flow=flow.flow
        )
        if all_agents_active:
            # empty flows cannot be created
            first_agent_id = flow.flow[0].get("agent_id")
            first_agent = await agent_repo.get(
                db=db,
                id_=first_agent_id,
                # user_model=current_user,  # agent's existence is validated on creation
            )
            if first_agent:
                if flow:
                    input_params = first_agent.input_parameters
                    if func := input_params.get("function"):
                        if func.get("name"):
                            input_params["function"]["name"] = str(flow.id)

                        if func.get("description"):
                            input_params["function"]["description"] = flow.description

                    flow_schema = FlowSchema(
                        agent_id=str(flow.id),
                        agent_name=flow.name,
                        agent_description=flow.description,
                        agent_input_schema=input_params,
                        flow=[flow.get("agent_id") for flow in flow.flow],
                    )
                    agents.append(flow_schema)

    return AgentAndFlowsDTO(agents=agents)
