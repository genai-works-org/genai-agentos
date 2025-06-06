import asyncio
import random
import re
import string
from typing import Any, Optional
from uuid import UUID

from mcp.types import Tool
from pydantic import AnyHttpUrl
from sqlalchemy import and_, select
from src.auth.jwt import TokenLifespanType, validate_token
from src.db.session import async_session
from src.models import A2ACard, Agent, MCPServer, MCPTool
from src.schemas.api.agent.dto import MLAgentJWTDTO
from src.schemas.api.exceptions import IntegrityErrorDetails
from src.schemas.base import AgentDTOPayload
from src.schemas.mcp.dto import MCPToolDTO
from src.utils.enums import AgentType
from src.utils.exceptions import InvalidToolNameException


def generate_alias(agent_name: str):
    rand_alnum_str = "".join(random.choice(string.ascii_lowercase) for _ in range(6))

    return f"{agent_name}_{rand_alnum_str}"


def get_user_id_from_jwt(token: str) -> Optional[str]:
    token_data = validate_token(token=token, lifespan_type=TokenLifespanType.api)
    return token_data.sub


def mcp_tool_to_json_schema(tool: Tool | MCPToolDTO) -> dict:
    tool_dict = tool.model_dump(exclude_none=True)

    if tool_dict.get("annotations"):
        tool_dict.pop("annotations")

    tool_dict.update(tool_dict.pop("inputSchema"))
    tool_dict["title"] = generate_alias(tool_dict.pop("name").replace(" ", "_"))

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
    port = f":{url.port}" if url.port and url.host in ("localhost", "0.0.0.0") else ""
    return (
        f"{url.scheme}://{str(url.host)}{port}"
        if isinstance(url, AnyHttpUrl)
        else url[:-1]
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
    ):
        tasks = []

        tasks.append(
            asyncio.create_task(
                self._validate_genai_ids(genai_ids=genai_ids, user_id=user_id)
            )
        )
        tasks.append(
            asyncio.create_task(
                self._validate_mcp_tools(mcp_tools_ids=mcp_ids, user_id=user_id)
            )
        )
        tasks.append(
            asyncio.create_task(
                self._validate_a2a_cards(a2a_cards_ids=a2a_ids, user_id=user_id)
            )
        )

        result: list[list[Optional[UUID]]] = await asyncio.gather(*tasks)

        valid_agents = []
        for r in result:
            r = [str(v) for v in r]
            valid_agents.extend(r)
        return valid_agents

    async def validate_is_active_of_all_agent_types(
        self, agent_ids: list[dict[str], str], user_id: UUID
    ):
        genai_ids = []
        mcp_ids = []
        a2a_ids = []
        for i in agent_ids:
            if genai := i.get("agent_id"):
                genai_ids.append(genai)

            if mcp := i.get("mcp_tool_id"):
                mcp_ids.append(mcp)

            if a2a := i.get("a2a_agent_id"):
                a2a_ids.append(a2a)

        return await self.validate_all_agents_types(
            genai_ids=genai_ids, mcp_ids=mcp_ids, a2a_ids=a2a_ids, user_id=user_id
        )
