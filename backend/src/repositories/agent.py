from typing import Optional, Union
from uuid import UUID

from fastapi import HTTPException
from mcp.types import Tool, ToolAnnotations
from pydantic import BaseModel
from sqlalchemy import and_, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from src.auth.jwt import TokenLifespanType, create_access_token, validate_token
from src.models import A2ACard, Agent, AgentWorkflow, MCPTool, User
from src.repositories.a2a import a2a_repo
from src.repositories.base import CRUDBase
from src.repositories.mcp import mcp_repo
from src.schemas.a2a.dto import A2AFirstAgentInFlow, ActiveA2ACardDTO
from src.schemas.a2a.schemas import A2AAgentCard
from src.schemas.api.agent.dto import (
    ActiveAgentsDTO,
    ActiveGenAIAgentDTO,
    AgentDTOWithJWT,
    MLAgentJWTDTO,
    MLAgentSchema,
)
from src.schemas.api.agent.schemas import AgentCreate, AgentRegister, AgentUpdate
from src.schemas.api.flow.schemas import AgentFlowAlias, FlowAgentId, FlowSchema
from src.schemas.base import AgentDTOPayload
from src.schemas.mcp.dto import ActiveMCPToolDTO, MCPToolDTO
from src.utils.enums import ActiveAgentTypeFilter, AgentType
from src.utils.filters import AgentFilter
from src.utils.helpers import (
    FlowValidator,
    generate_alias,
    map_agent_model_to_dto,
    map_genai_agent_to_unified_dto,
    mcp_tool_to_json_schema,
)


class AgentRepository(CRUDBase[Agent, AgentCreate, AgentUpdate]):
    async def get_one_by_user(
        self, db: AsyncSession, id_: UUID, user_model: User
    ) -> Optional[Agent]:
        """
        Method to get an agent by user.
        In case when two agents have the same id, name, description
        the agent with the most recent last_invoked_at will be returned.
        """
        q = await db.execute(
            select(self.model)
            .where(
                and_(
                    self.model.id == str(id_),
                    self.model.creator_id == str(user_model.id),
                )
            )
            .order_by(self.model.last_invoked_at.desc())
        )
        return q.scalars().first()

    async def _insert_new_agent(
        self,
        user_model: User,
        obj_in: Union[AgentCreate, AgentUpdate],
    ):
        alias = generate_alias(obj_in.name)
        db_obj = Agent(
            id=obj_in.id,
            name=obj_in.name,
            description=obj_in.description,
            input_parameters=obj_in.input_parameters,
            creator_id=str(user_model.id),
            is_active=False,
            alias=alias,
        )
        return db_obj

    async def create_by_user(
        self, db: AsyncSession, *, obj_in: AgentRegister, user_model: User
    ) -> AgentDTOWithJWT:
        """
        Creates a new Agent associated with the given user.

        Args:
            db: The database session.
            obj_in: The AgentRegister object containing the agent's details.
            user_id: The ID of the user creating the agent.

        Returns:
            The newly created Agent object.

        Raises:
            Any database-related exceptions will be propagated.
        """

        # This lookup for existing agent is needed due to the way jwt is created.
        # Since jwt is tied to the `Agent.id`, it needs to be added via `db_obj.jwt = jwt`
        # which is treated as table **update** by sqlalchemy

        existing_agent = await self.get_by_user(
            db=db, id_=obj_in.id, user_model=user_model
        )
        if existing_agent:
            raise HTTPException(
                status_code=400, detail=f"Agent with {obj_in.id} already exists"
            )

        db_obj: Optional[Agent] = await self._insert_new_agent(
            user_model=user_model, obj_in=obj_in
        )
        jwt = create_access_token(
            subject=str(db_obj.id),
            lifespan_type=TokenLifespanType.cli,
            user_id=str(db_obj.creator_id),
        )

        db_obj.jwt = jwt
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        return AgentDTOWithJWT(**db_obj.__dict__)

    async def get_all_online_agents(
        self, db: AsyncSession, user_model: User, offset: int = 0, limit: int = 100
    ) -> list[Agent]:
        """
        Get all agents that were registered in the backend.

        Args:
            db: The database session.

        Returns:
            A list of Agent objects that are online.
        """
        agents = await self.get_multiple_by_user(
            db, user_model=user_model, offset=offset, limit=limit
        )
        agent_schemas = [
            MLAgentSchema(
                agent_id=str(agent.id),
                agent_name=agent.name,
                agent_description=agent.description,
                agent_schema=agent.input_parameters,
            ).model_dump(mode="json")
            for agent in agents
            if agent.is_active
        ]
        return ActiveAgentsDTO(
            count_active_connections=len(agent_schemas),
            active_connections=agent_schemas,
        )

    async def get_all_online_agents_by_user(
        self, db: AsyncSession, user_model: User, offset: int = 0, limit: int = 100
    ):
        agents = await self.get_multiple_by_user(
            db, user_model=user_model, offset=offset, limit=limit
        )
        agent_schemas = [
            MLAgentSchema(
                agent_id=str(agent.id),
                agent_name=agent.name,
                agent_description=agent.description,
                agent_schema=agent.input_parameters,
            ).model_dump(mode="json")
            for agent in agents
            if agent.is_active
        ]
        return ActiveAgentsDTO(
            count_active_connections=len(agent_schemas),
            active_connections=agent_schemas,
        )

    async def get_agent(
        self, db: AsyncSession, id_: str, user_model: User
    ) -> Optional[MLAgentJWTDTO]:
        agent = await self.get_by_user(db=db, id_=id_, user_model=user_model)
        if not agent:
            raise HTTPException(status_code=400, detail=f"Agent {id_} was not found.")
        return map_agent_model_to_dto(agent=agent)

    async def query_active_agents(
        self, db: AsyncSession, user_id: UUID, limit: int, offset: int
    ):
        q = await db.scalars(
            select(self.model)
            .where(
                self.model.is_active == True,  # noqa: E712
                self.model.creator_id == user_id,
            )
            .order_by(self.model.created_at.desc())
            .limit(limit=limit)
            .offset(offset=offset)
        )
        return q.all()

    async def list_all_active_genai_agents(
        self, db: AsyncSession, user_id: UUID, limit: int, offset: int
    ) -> ActiveAgentsDTO:
        flows = await self._get_all_active_flows_by_user(db=db, user_id=user_id)
        agents = await self.query_active_agents(
            db=db, user_id=user_id, offset=offset, limit=limit
        )
        agent_dtos = [map_genai_agent_to_unified_dto(agent=agent) for agent in agents]
        result: list[MLAgentJWTDTO | FlowSchema | None] = [*flows, *agent_dtos]
        return ActiveAgentsDTO(
            count_active_connections=len(result),
            active_connections=[
                r.model_dump(mode="json", exclude_none=True) for r in result if r
            ],
        )

    async def set_all_agents_inactive(self, db: AsyncSession) -> None:
        """
        Set is_active=False for all agents in the database on startup of the backend

        Args:
            db: The database session.

        Returns: None
        """
        q = await db.execute(select(self.model))
        agents = q.scalars().all()
        if not agents:
            return

        for agent in agents:
            agent.is_active = False

        await db.commit()
        return

    async def set_agent_as_inactive(
        self, db: AsyncSession, id_: str, user_id: str
    ) -> Agent:
        user_q = await db.execute(select(User).where(User.id == user_id))
        user = user_q.scalars().first()
        if not user:
            return

        agent = await self.get_by_user(db=db, id_=id_, user_model=user)
        if agent:
            await db.execute(
                update(self.model)
                .where(
                    and_(self.model.id == agent.id, self.model.creator_id == user_id)
                )
                .values({"is_active": False})
            )
            await db.commit()
            return True

        return

    async def validate_agent_by_jwt(
        self, db: AsyncSession, agent_jwt: str
    ) -> Optional[Agent]:
        agent_jwt_payload = validate_token(
            token=agent_jwt, lifespan_type=TokenLifespanType.cli
        )
        if not agent_jwt_payload:
            return  # TODO: raise jwt invalid
        q = await db.execute(
            select(self.model).where(
                and_(
                    self.model.id == agent_jwt_payload.sub,
                    self.model.creator_id == agent_jwt_payload.user_id,
                )
            )
        )
        return q.scalars().first()  # one jwt per one agent per user

    async def get_agent_by_id(
        self, db: AsyncSession, agent_id: UUID, user_model: User
    ) -> Optional[Agent]:
        q = await db.execute(
            select(self.model).where(
                and_(
                    self.model.id == str(agent_id),
                    self.model.creator_id == str(user_model.id),
                )
            )
        )
        return q.scalars().first()

    async def list_agents_by_name(
        self,
        db: AsyncSession,
        agent_name: str,
        user_model: User,
        limit: int = 100,
        offset: int = 0,
    ) -> list[Optional[Agent]]:
        q = await db.execute(
            select(self.model)
            .where(
                and_(
                    self.model.name == agent_name,
                    self.model.creator_id == str(user_model.id),
                )
            )
            .limit(limit=limit)
            .offset(offset=offset)
            .order_by(self.model.created_at.desc())
        )
        return q.scalars().all()

    async def find_agent_by_description(
        self, db: AsyncSession, description_query: str, user_model: User
    ) -> Optional[Agent]:
        q = await db.execute(
            select(self.model).where(
                and_(
                    self.model.description.ilike(f"%{description_query}%"),
                    self.model.creator_id == str(user_model.id),
                )
            )
        )
        return q.scalars().first()

    async def search_agents_by_description(
        self,
        db: AsyncSession,
        description_query: str,
        user_model: User,
        limit: int = 100,
        offset: int = 0,
    ):
        q = await db.execute(
            select(self.model)
            .where(
                and_(
                    self.model.description.ilike(f"%{description_query}%"),
                    self.model.creator_id == str(user_model.id),
                )
            )
            .limit(limit=limit)
            .offset(offset=offset)
            .order_by(self.model.created_at.desc())
        )
        return q.scalars().all()

    async def filter_out_empty_agents(
        self, db: AsyncSession, user_model: User, limit: int, offset: int
    ):
        q = await db.scalars(
            select(self.model)
            .where(
                and_(
                    self.model.name != "",
                    self.model.description != "",
                    self.model.creator_id == user_model.id,
                )
            )
            .order_by(self.model.created_at)
            .limit(limit=limit)
            .offset(offset=offset)
        )
        return q.all()

    async def query_by_filter(
        self,
        db: AsyncSession,
        user_model: User,
        filter_field: AgentFilter,
        limit: int = 0,
        offset: int = 0,
    ):
        if filter_field.name:
            agents = await self.list_agents_by_name(
                db=db,
                agent_name=filter_field.name,
                user_model=user_model,
                limit=limit,
                offset=offset,
            )
            return agents

        if filter_field.description:
            agents = await self.search_agents_by_description(
                db=db,
                description_query=filter_field.description,
                user_model=user_model,
                limit=limit,
                offset=offset,
            )
            return agents

        return await self.filter_out_empty_agents(
            db=db, user_model=user_model, limit=limit, offset=offset
        )

    async def query_all_platform_agents(
        self, db: AsyncSession, user_id: UUID, offset: int, limit: int
    ):
        """
        Query all platform agents - genai, mcp, a2a.
        Using raw union query instead of multiple queries via ORM to preserve ordering.
        To use union query, all of the tables must have the same amount of columns.
        Missing columns are replaced with NULLs.
        """
        q = text(
            """
SELECT
    'agents' as table_source,
    id,
    name,
    description,
    jwt,
    creator_id,
    input_parameters as json_data1,
    NULL as server_url,
    created_at,
    updated_at,
    last_invoked_at,
    is_active,
    alias,
    NULL as json_data2
FROM agents
WHERE creator_id = :creator_id AND is_active = TRUE

UNION ALL

SELECT
    'mcptools' as table_source,
    t.id,
    t.name,
    t.description,
    NULL as jwt,
    m.creator_id,
    t."inputSchema" as json_data1,
    m.server_url as server_url,
    m.created_at,
    m.updated_at,
    NULL as last_invoked_at,
    TRUE as is_active,
    t.alias,
    t.annotations as json_data2
FROM mcpservers as m
JOIN mcptools as t ON m.id = t.mcp_server_id
WHERE m.creator_id = :creator_id AND m.is_active = TRUE

UNION ALL

SELECT
    'a2acards' as table_source,
    id,
    name,
    description,
    NULL as jwt,
    creator_id,
    card_content as json_data1,
    server_url,
    created_at,
    updated_at,
    NULL as last_invoked_at,
    is_active,
    alias,
    NULL as json_data2
FROM a2acards
WHERE creator_id = :creator_id AND is_active = TRUE

ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
"""
        )

        result = await db.execute(
            q, {"creator_id": str(user_id), "limit": limit, "offset": offset}
        )
        return result.fetchall()

    async def orm_flow_to_dto(self, flow: AgentWorkflow, db: AsyncSession):
        if not flow.flow:
            return None  # TODO: raise?

        first_agent = flow.flow[0]

        first_agent_id = first_agent.get("id")
        first_agent_type = first_agent.get("type")

        first_existing_agent = None

        if first_agent_type == AgentType.genai.value:
            first_genai_agent = await agent_repo.get(
                db=db,
                id_=first_agent_id,
            )
            if not first_genai_agent:
                raise HTTPException(
                    status_code=400,
                    detail=f"GenAI agent with id: {first_agent_id} was not found."
                    f' Make sure you have passed "agent_id": "your id" in the flow correctly',  # noqa: E501
                )
            first_existing_agent = first_genai_agent

        if first_agent_type == AgentType.mcp.value:
            first_mcp_tool = await mcp_repo.get_tool_by_id(db=db, id_=first_agent_id)
            if not first_mcp_tool:
                raise HTTPException(
                    status_code=400,
                    detail=f"MCP tool with id: {first_agent_id} was not found."
                    f' Make sure you have passed "mcp_tool_id": "your id" in the flow correctly',  # noqa: E501
                )
            first_existing_agent = first_mcp_tool

        if first_agent_type == AgentType.a2a.value:
            first_a2a_card = await a2a_repo.get(db=db, id_=first_agent_id)
            if not first_a2a_card:
                raise HTTPException(
                    status_code=400,
                    detail=f"A2A card with id: {first_agent_id} was not found."
                    f' Make sure you have passed "a2a_card_id": "your id" in the flow correctly',  # noqa: E501
                )
            first_existing_agent = first_a2a_card

        if first_existing_agent:
            input_params = None
            if isinstance(first_existing_agent, Agent):
                input_params = first_existing_agent.input_parameters
                # TODO: check is genai_agent
                if func := input_params.get("function"):
                    if func.get("name"):
                        input_params["function"]["name"] = flow.alias

                    if func.get("description"):
                        input_params["function"]["description"] = flow.description

            if isinstance(first_existing_agent, MCPTool):
                input_params = mcp_tool_to_json_schema(
                    MCPToolDTO(
                        id=first_existing_agent.id,
                        name=flow.name,
                        description=flow.description,
                        alias=flow.alias,
                        inputSchema=first_existing_agent.inputSchema,
                        annotations=first_existing_agent.annotations,
                        mcp_server_id=first_existing_agent.mcp_server_id,
                    )
                )
                input_params["title"] = flow.alias
                input_params["description"] = flow.description

            if isinstance(first_existing_agent, A2ACard):
                input_params = A2AFirstAgentInFlow(
                    name=flow.alias, description=flow.description
                ).model_dump(mode="json")

            flow_schema = AgentDTOPayload(
                id=flow.id,
                name=flow.alias,
                type=AgentType.flow,
                agent_schema=input_params,
                created_at=flow.created_at,
                updated_at=flow.updated_at,
                flow=[agent.get("id") for agent in flow.flow],
                is_active=flow.is_active,
            )
            return flow_schema

    async def _get_all_active_flows_by_user(
        self, db: AsyncSession, user_id: UUID
    ) -> list[Optional[FlowSchema]]:
        q = await db.scalars(
            select(AgentWorkflow).where(
                and_(
                    AgentWorkflow.creator_id == user_id,
                )
            )
        )
        flows = q.all()
        if not flows:
            return []

        valid_flows = []
        flow_validator = FlowValidator()

        for f in flows:
            flow = AgentFlowAlias(
                name=f.name,
                description=f.description,
                flow=[FlowAgentId(**a) for a in f.flow],
                alias=f.alias,
            )
            valid_agents = await flow_validator.validate_is_active_of_all_agent_types(
                flow_agents=flow.flow, user_id=user_id
            )

            if len(valid_agents) < len(flow.flow):
                continue

            flow = await self.orm_flow_to_dto(f, db=db)

            if not flow:
                continue

            valid_flows.append(flow)

        return valid_flows

    async def lookup_genai_agents_are_active_in_flow(
        self, db: AsyncSession, agent_ids: list[str | UUID]
    ) -> bool:
        # TODO: this method only looks up genai agents.
        # Since genai flow can have mcp and a2a tools, need to lookup them too
        q = await db.scalars(
            select(self.model.is_active).where(self.model.id.in_(agent_ids))
        )
        return all(q.all())

    async def map_agents_to_dto_models(
        self, db: AsyncSession, user_id: UUID, offset: int, limit: int
    ):
        result = await self.query_all_platform_agents(
            db=db, user_id=user_id, limit=limit, offset=offset
        )
        columns = [row._asdict() for row in result]
        flows = await self._get_all_active_flows_by_user(db=db, user_id=user_id)

        response: list[
            Optional[ActiveA2ACardDTO | ActiveGenAIAgentDTO | ActiveMCPToolDTO]
        ] = []
        if flows:
            response.extend(flows)
        for col in columns:
            agent_type = col.pop("table_source")
            if agent_type == "mcptools":
                fields_to_pop = [
                    "jwt",
                    "last_invoked_at",
                ]
                for field in fields_to_pop:
                    col.pop(field)

                created_at = col.pop("created_at")
                updated_at = col.pop("updated_at")

                tool_schema = mcp_tool_to_json_schema(
                    Tool(
                        name=col["name"],
                        description=col["description"],
                        inputSchema=col["json_data1"],
                        annotations=ToolAnnotations(**col["json_data2"])
                        if col["json_data2"]
                        else None,
                    ),
                    aliased_title=col["alias"],
                )
                mcp_tool = AgentDTOPayload(
                    id=col["id"],
                    name=tool_schema["title"],
                    type=AgentType.mcp,
                    url=col["server_url"],
                    agent_schema=tool_schema,
                    created_at=created_at,
                    updated_at=updated_at,
                    is_active=True,
                )

                response.append(mcp_tool)

            if agent_type == "a2acards":
                fields_to_pop = [
                    "jwt",
                    "last_invoked_at",
                ]
                for field in fields_to_pop:
                    col.pop(field)

                created_at = col.pop("created_at")
                updated_at = col.pop("updated_at")

                card_content: dict = col["json_data1"]
                card_content.pop("name", None)
                description = card_content.pop("description", None)
                url = card_content.pop("url", None)
                alias = col["alias"]
                agent_schema = A2AAgentCard(
                    **card_content,
                    name=alias if alias else col["alias"],
                    description=description if description else col["description"],
                    url=url if url else col["server_url"],
                )

                agent_card = a2a_repo.agent_card_to_dto(
                    agent_card=agent_schema,
                    created_at=created_at,
                    updated_at=updated_at,
                    id_=col["id"],
                )

                response.append(agent_card)

            if agent_type == "agents":
                fields_to_pop = [
                    "server_url",
                ]
                for field in fields_to_pop:
                    col.pop(field)

                input_params = col["json_data1"]
                alias = col["alias"]
                if input_params:
                    input_params["function"]["name"] = alias
                agent = ActiveGenAIAgentDTO(
                    agent_id=str(col["id"]),
                    agent_name=alias,
                    agent_description=col["description"],
                    agent_schema=input_params,
                    agent_jwt=col["jwt"],
                    agent_alias=alias,
                    is_active=col["is_active"],
                    created_at=col["created_at"],
                    updated_at=col["updated_at"],
                )
                agent_dto = AgentDTOPayload(
                    id=agent.agent_id,
                    name=agent.agent_name,
                    type=AgentType.genai,
                    agent_schema=agent.agent_schema,
                    created_at=agent.created_at,
                    updated_at=agent.updated_at,
                    is_active=agent.is_active,
                )
                response.append(agent_dto)

        return ActiveAgentsDTO(
            count_active_connections=len(response),
            active_connections=[
                resp_model.model_dump(exclude_none=True)
                if isinstance(resp_model, BaseModel)
                else resp_model
                for resp_model in response
            ],
        )

    async def list_all_mcp_tools(
        self, db: AsyncSession, user_id: UUID, limit: int, offset: int
    ):
        mcp_servers = await mcp_repo.list_active_mcp_servers(
            db=db, user_id=user_id, limit=limit, offset=offset
        )
        tools = []
        for s in mcp_servers:
            for tool in s.mcp_tools:
                tool_schema = mcp_tool_to_json_schema(
                    tool=tool, aliased_title=tool.alias
                )

                tools.append(
                    AgentDTOPayload(
                        id=tool.id,
                        name=tool.name,
                        type=AgentType.mcp,
                        url=s.server_url,
                        agent_schema=tool_schema,
                        created_at=s.created_at,
                        updated_at=s.updated_at,
                    ).model_dump(mode="json", exclude_none=True)
                )

        return ActiveAgentsDTO(
            count_active_connections=len(tools),
            active_connections=tools,
        )

    async def list_all_a2a_cards(
        self, db: AsyncSession, user_id: UUID, limit: int, offset: int
    ):
        result = await a2a_repo.list_active_cards(
            db=db, user_id=user_id, limit=limit, offset=offset
        )
        return ActiveAgentsDTO(
            count_active_connections=len(result),
            active_connections=result,
        )

    async def get_active_agents_by_filter(
        self,
        db: AsyncSession,
        agent_type: ActiveAgentTypeFilter,
        user_id: UUID,
        limit: int,
        offset: int,
    ):
        if agent_type == agent_type.genai:
            return await self.list_all_active_genai_agents(
                db=db, user_id=user_id, limit=limit, offset=offset
            )
        elif agent_type == agent_type.a2a:
            return await self.list_all_a2a_cards(
                db=db, user_id=user_id, limit=limit, offset=offset
            )
        elif agent_type == agent_type.mcp:
            return await self.list_all_mcp_tools(
                db=db, user_id=user_id, limit=limit, offset=offset
            )

        else:
            return await self.map_agents_to_dto_models(
                db=db, user_id=user_id, limit=limit, offset=offset
            )


agent_repo = AgentRepository(Agent)
