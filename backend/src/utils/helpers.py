import asyncio
import random
import re
import string
from typing import Any, Optional
from urllib.parse import urlparse, urlunparse
from uuid import UUID

from fastapi import HTTPException
from mcp.types import Tool
from pydantic import AnyHttpUrl
from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from src.auth.encrypt import encrypt_secret
from src.auth.jwt import TokenLifespanType, validate_token
from src.db.session import async_session
from src.models import A2ACard, Agent, AgentWorkflow, MCPServer, MCPTool
from src.schemas.api.agent.dto import MLAgentJWTDTO
from src.schemas.api.exceptions import IntegrityErrorDetails
from src.schemas.api.flow.schemas import FlowAgentId
from src.schemas.base import AgentDTOPayload
from src.schemas.mcp.dto import MCPToolDTO
from src.utils.enums import AgentType
from src.utils.exceptions import InvalidToolNameException


def generate_alias(agent_name: str):
    rand_alnum_str = "".join(random.choice(string.ascii_lowercase) for _ in range(6))

    return f"{agent_name}_{rand_alnum_str}"


def get_user_id_from_jwt(token: str) -> Optional[str]:
    token_data = validate_token(token=token, lifespan_type=TokenLifespanType.api)
    if not token_data:
        raise HTTPException(status_code=400, detail="JWT token is invalid or expired")
    return token_data.sub


def mcp_tool_to_json_schema(
    tool: Tool | MCPToolDTO, aliased_title: Optional[str] = None
) -> dict:
    if isinstance(tool, MCPToolDTO):
        tool_dict = tool.model_dump(exclude_none=True)
        tool_dict.pop("id")
        tool_dict.pop("alias")
        tool_dict.pop("mcp_server_id")
    else:
        tool_dict = tool.model_dump(exclude_none=True)

    if tool_dict.get("annotations"):
        tool_dict.pop("annotations")

    tool_dict.update(tool_dict.pop("inputSchema"))
    if aliased_title:
        tool_dict.pop("name")

    tool_dict["title"] = (
        aliased_title
        if aliased_title
        else generate_alias(tool_dict.pop("name").replace(" ", "_"))
    )

    if not tool_dict.get("properties", {}):
        tool_dict["required"] = []
    return tool_dict


def validate_tool_name(tool_name: str) -> Optional[str]:
    # TODO: enforce validation or rm this func
    pattern = r"^[a-zA-Z0-9_\\.-]+$"
    match = re.search(pattern=pattern, string=tool_name)
    if not match:
        raise InvalidToolNameException(
            f"Tool name: '{tool_name}' is invalid and must match the following regex pattern: {pattern}."
        )

    return tool_name


def get_agent_description_from_skills(
    description: str, skills: list[dict[str, Any]]
) -> str:
    combined_skill_descriptions = "\n".join([skill["description"] for skill in skills])
    full_agent_description = f"{description}\nSKILLS:\n{combined_skill_descriptions}"
    return full_agent_description


def map_agent_model_to_dto(agent: Agent):
    """
    Helper function to map agent model to universal output structure
    Params:
        agent: GenAI agent ORM model instance
        loaded_tags: bool to indicate whether `tags` were explicitly loaded via `selectinload`
    Returns:
        Populated MLAgentJWTDTO object
    """
    return MLAgentJWTDTO(
        agent_id=str(agent.id),
        agent_name=agent.alias,
        agent_description=agent.description,
        agent_schema=agent.input_parameters,
        created_at=agent.created_at,
        updated_at=agent.updated_at,
        is_active=agent.is_active,
        agent_jwt=agent.jwt,
        agent_alias=agent.alias,
    )


def map_genai_agent_to_unified_dto(agent: Agent):
    input_params = agent.input_parameters
    if input_params:
        input_params["function"]["name"] = agent.alias
    return AgentDTOPayload(
        id=agent.id,
        name=agent.alias,
        type=AgentType.genai,
        agent_schema=agent.input_parameters,
        created_at=agent.created_at,
        updated_at=agent.updated_at,
        is_active=agent.is_active,
    )


def prettify_integrity_error_details(msg: str) -> Optional[IntegrityErrorDetails]:
    """
    Helper function to match integrity error output into more dev-friendly output
    Below pattern will match: '(email)=(kekster3@a.com)' and '(username)=(kekster3)'
    where IntegrityError returns 'email' or 'username'
    as column name and value after the equal sign in the message
    """
    pattern = r"\(([^)]+)\)=\(([^)]+)\)"

    matches: list[Optional[tuple[str]]] = re.findall(pattern=pattern, string=msg)
    if matches:
        column = matches[0][0]
        value = matches[0][1]

        return IntegrityErrorDetails(column=column, value=value)
    return None


def strip_endpoints_from_url(url: AnyHttpUrl | str) -> str:
    """
    Strips the path, query, and fragment from a URL to return only the base address.

    Args:
        url: The URL to process, as a string or Pydantic AnyHttpUrl.

    Returns:
        The root URL string (e.g., 'http://example.com:8080').

    """
    url_str = str(url)
    parsed_url = urlparse(url_str)
    return urlunparse(
        (
            parsed_url.scheme,
            parsed_url.netloc,
            "",  # path
            "",  # params
            "",  # query
            "",  # fragment
        )
    )


class FlowValidator:
    async def _validate_genai_ids(self, genai_ids: list[Optional[str]], user_id: UUID):
        async with async_session() as db:
            q = await db.scalars(
                select(Agent.id).where(
                    and_(
                        Agent.id.in_(genai_ids),
                        Agent.is_active.is_(True),
                        Agent.creator_id == user_id,
                    )
                )
            )
            return q.all()

    async def _validate_mcp_tools(
        self, mcp_tools_ids: list[Optional[str]], user_id: UUID
    ):
        async with async_session() as db:
            q = await db.scalars(
                select(MCPTool.id)
                .join(MCPServer, MCPTool.mcp_server_id == MCPServer.id)
                .where(
                    and_(
                        MCPTool.id.in_(mcp_tools_ids),
                        MCPServer.is_active.is_(True),
                        MCPServer.creator_id == user_id,
                    )
                )
            )
        return q.all()

    async def _validate_a2a_cards(
        self, a2a_cards_ids: list[Optional[str]], user_id: UUID
    ):
        async with async_session() as db:
            q = await db.scalars(
                select(A2ACard.id).where(
                    and_(
                        A2ACard.id.in_(a2a_cards_ids),
                        A2ACard.is_active.is_(True),
                        A2ACard.creator_id == user_id,
                    )
                )
            )
        return q.all()

    async def validate_all_agents_types(
        self,
        genai_ids: list[Optional[str]],
        mcp_ids: list[Optional[str]],
        a2a_ids: list[Optional[str]],
        user_id: UUID,
    ) -> list[str]:
        """
        Returns: list of valid (is_active=True) agent ids of all agent types (genai/mcp/a2a)
        """
        tasks = (
            asyncio.create_task(
                self._validate_genai_ids(genai_ids=genai_ids, user_id=user_id)
            ),
            asyncio.create_task(
                self._validate_mcp_tools(mcp_tools_ids=mcp_ids, user_id=user_id)
            ),
            asyncio.create_task(
                self._validate_a2a_cards(a2a_cards_ids=a2a_ids, user_id=user_id)
            ),
        )

        result: list[list[Optional[UUID]]] = await asyncio.gather(*tasks)
        return [str(v) for r in result for v in r]

    async def validate_is_active_of_all_agent_types(
        self, flow_agents: list[FlowAgentId], user_id: UUID
    ):
        genai_ids = []
        mcp_ids = []
        a2a_ids = []

        for agent in flow_agents:
            agent_id = agent.id

            if agent.type == AgentType.genai.value:
                genai_ids.append(agent_id)

            if agent.type == AgentType.mcp.value:
                mcp_ids.append(agent_id)

            if agent.type == AgentType.a2a.value:
                a2a_ids.append(agent_id)

        return await self.validate_all_agents_types(
            genai_ids=genai_ids, mcp_ids=mcp_ids, a2a_ids=a2a_ids, user_id=user_id
        )

    async def trigger_flow_validation_on_agent_state_change(
        self, db: AsyncSession, agent_type: AgentType
    ):
        """
        Unified helper method to run during mcp/a2a lookups to set flows with inactive tools/cards as inactive
        """
        active_flows = await db.scalars(
            select(AgentWorkflow)
            .order_by(AgentWorkflow.created_at)
            .order_by(AgentWorkflow.created_at.desc())
        )
        agentflows: list[AgentWorkflow] = active_flows.all()
        flow_ids = [f.id for f in agentflows]
        flows = [f.flow for f in agentflows]
        for flow_id, flow in zip(flow_ids, flows):
            flow_agent_ids = []  # either mcp/a2a ids
            for tool in flow:
                if tool["type"] == agent_type.value:
                    flow_agent_ids.append(tool)

            if AgentType.mcp == agent_type:
                active_tools = await db.scalars(
                    select(MCPTool)
                    .join(MCPServer, MCPServer.id == MCPTool.mcp_server_id)
                    .where(
                        and_(
                            MCPTool.id.in_([a["id"] for a in flow_agent_ids]),
                            MCPServer.is_active.is_(True),
                        )
                    )
                )

                if len(active_tools.all()) != len(
                    [
                        f["id"]
                        for f in flow_agent_ids
                        if f["type"] == AgentType.mcp.value
                    ]
                ):
                    await db.execute(
                        update(AgentWorkflow)
                        .where(AgentWorkflow.id == flow_id)
                        .values({"is_active": False})
                    )
                    await db.commit()
                else:
                    await db.execute(
                        update(AgentWorkflow)
                        .where(AgentWorkflow.id == flow_id)
                        .values({"is_active": True})
                    )
                    await db.commit()

            if AgentType.a2a == agent_type:
                active_cards = await db.scalars(
                    select(A2ACard).where(
                        and_(
                            A2ACard.id.in_([a["id"] for a in flow_agent_ids]),
                            A2ACard.is_active.is_(True),
                        )
                    )
                )
                if len(active_cards.all()) != len(
                    [
                        f["id"]
                        for f in flow_agent_ids
                        if f["type"] == AgentType.a2a.value
                    ]
                ):
                    await db.execute(
                        update(AgentWorkflow)
                        .where(AgentWorkflow.id == flow_id)
                        .values({"is_active": False})
                    )
                    await db.commit()
                else:
                    await db.execute(
                        update(AgentWorkflow)
                        .where(AgentWorkflow.id == flow_id)
                        .values({"is_active": True})
                    )
                    await db.commit()

            if AgentType.genai == agent_type:
                active_agents = await db.scalars(
                    select(Agent).where(
                        and_(
                            Agent.id.in_([a["id"] for a in flow_agent_ids]),
                            Agent.is_active.is_(True),
                        )
                    )
                )
                if len(active_agents.all()) != len(
                    [
                        f["id"]
                        for f in flow_agent_ids
                        if f["type"] == AgentType.genai.value
                    ]
                ):
                    await db.execute(
                        update(AgentWorkflow)
                        .where(AgentWorkflow.id == flow_id)
                        .values({"is_active": False})
                    )
                    await db.commit()
                else:
                    await db.execute(
                        update(AgentWorkflow)
                        .where(AgentWorkflow.id == flow_id)
                        .values({"is_active": True})
                    )
                    await db.commit()

    async def trigger_flow_state_lookup_of_all_agents(
        self,
        flow: AgentWorkflow,
        user_id: UUID,
    ) -> AgentWorkflow:
        agents = []
        for a in flow.flow:
            agent_id = FlowAgentId(**a)
            agents.append(agent_id)

        active_agents = await self.validate_is_active_of_all_agent_types(
            flow_agents=agents, user_id=user_id
        )

        # lookup via all() is covering the cases when there are multiple tools in the flow with the same id
        if all([a["id"] in active_agents for a in flow.flow]):
            flow.is_active = True
        else:
            flow.is_active = False

        return flow


def validate_and_encrypt_provider_api_key(api_key: str) -> str:
    if not api_key:
        raise ValueError("'api_key' must be specified for this provider")
    if len(api_key) < 1:
        raise ValueError("'api_key' param cannot be empty")
    if isinstance(api_key, str):
        return encrypt_secret(api_key)
    return api_key
