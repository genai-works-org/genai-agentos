from typing import Optional, Union
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import and_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from src.auth.jwt import TokenLifespanType, create_access_token, validate_token
from src.models import Agent, AgentWorkflow, User
from src.repositories.a2a import a2a_repo
from src.repositories.base import CRUDBase
from src.repositories.mcp import mcp_repo
from src.schemas.a2a.dto import ActiveA2ACardDTO
from src.schemas.a2a.schemas import A2AAgentCard
from src.schemas.api.agent.dto import (
    ActiveAgentsDTO,
    ActiveGenAIAgentDTO,
    AgentDTOWithJWT,
    MLAgentJWTDTO,
    MLAgentSchema,
)
from src.schemas.api.agent.schemas import AgentCreate, AgentRegister, AgentUpdate
from src.schemas.api.flow.schemas import FlowSchema
from src.schemas.mcp.dto import ActiveMCPToolDTO
from src.utils.enums import ActiveAgentTypeFilter
from src.utils.filters import AgentFilter
from src.utils.helpers import generate_alias, map_agent_model_to_dto


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

    async def list_all_agents(
        self, db: AsyncSession, user_id: UUID, limit: int, offset: int
    ) -> list[Optional[MLAgentJWTDTO]]:
        result = await self.get_multiple_by_user_id(
            db=db, user_id=user_id, offset=offset, limit=limit
        )
        return [map_agent_model_to_dto(agent=agent) for agent in result]

    async def get_agents_by_ids(
        self, db: AsyncSession, agent_ids: list[str], user_model: User
    ) -> list[Optional[str]]:
        """
        Get all agent_ids queried by the provided collection of agent_ids.

        Args:
            db: The database session.
            agents_from_flow: list of [{"agent_id": uuid}, {"agent_id": uuid}, ...]

        Returns:
            A list of Agent objects that are online and match provided agent_id.
        """
        # `is` comparison vs booleans is not supported in SQLAlchemy
        q = await db.execute(
            select(self.model).where(
                and_(
                    self.model.id.in_(agent_ids),
                    self.model.creator_id == user_model.id,
                    self.model.is_active == True,  # noqa: E712
                )
            )
        )
        agents = q.scalars().all()
        return [str(agent.id) for agent in agents]

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
            agent.is_active = False

        await db.commit()
        await db.refresh(agent)
        return agent

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

    async def query_by_filter(
        self,
        db: AsyncSession,
        user_model: User,
        filter_field: AgentFilter,
        limit: int = 0,
        offset: int = 0,
    ):
        if filter_field.name:
            return await self.list_agents_by_name(
                db=db,
                agent_name=filter_field.name,
                user_model=user_model,
                limit=limit,
                offset=offset,
            )

        if filter_field.description:
            return await self.search_agents_by_description(
                db=db,
                description_query=filter_field.description,
                user_model=user_model,
                limit=limit,
                offset=offset,
            )

        return await self.list_all_agents(
            db=db, user_id=user_model.id, limit=limit, offset=offset
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
    alias
FROM agents
WHERE creator_id = :creator_id AND is_active = TRUE

UNION ALL

SELECT
    'mcpservers' as table_source,
    id,
    name,
    description,
    NULL as jwt,
    creator_id,
    mcp_tools as json_data1,
    server_url,
    created_at,
    updated_at,
    NULL as last_invoked_at,
    is_active,
    NULL as alias
FROM mcpservers
WHERE creator_id = :creator_id AND is_active = TRUE

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
    NULL as alias
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
        first_agent_id = flow.flow[0].get("agent_id")
        first_agent = await agent_repo.get(
            db=db,
            id_=first_agent_id,
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
                    agent_schema=input_params,
                    flow=[flow.get("agent_id") for flow in flow.flow],
                )
                return flow_schema

    async def _get_all_flows_by_user(
        self, db: AsyncSession, user_id: UUID
    ) -> list[Optional[FlowSchema]]:
        q = await db.scalars(
            select(AgentWorkflow).where(AgentWorkflow.creator_id == user_id)
        )
        flows = q.all()
        if not flows:
            return []

        valid_flows = []
        for f in flows:
            flow = await self.orm_flow_to_dto(f, db=db)
            if not flow:
                continue
            valid_flows.append(flow)

        return valid_flows

    async def map_agents_to_dto_models(
        self, db: AsyncSession, user_id: UUID, offset: int, limit: int
    ):
        result = await self.query_all_platform_agents(
            db=db, user_id=user_id, limit=limit, offset=offset
        )
        columns = [row._asdict() for row in result]
        flows = await self._get_all_flows_by_user(db=db, user_id=user_id)

        response: list[
            Optional[ActiveA2ACardDTO | ActiveGenAIAgentDTO | ActiveMCPToolDTO]
        ] = []
        if flows:
            response.extend(flows)
        for col in columns:
            agent_type = col.pop("table_source")
            if agent_type == "mcpservers":
                fields_to_pop = [
                    "name",
                    "description",
                    "jwt",
                    "last_invoked_at",
                    "alias",
                ]
                for field in fields_to_pop:
                    col.pop(field)

                tools = col.pop("json_data1")

                created_at = col.pop("created_at")
                updated_at = col.pop("updated_at")

                modified_tools = [
                    ActiveMCPToolDTO(
                        agent_schema=t, created_at=created_at, updated_at=updated_at
                    )
                    for t in tools
                ]
                response.extend(modified_tools)

            if agent_type == "a2acards":
                fields_to_pop = [
                    "jwt",
                    "last_invoked_at",
                    "alias",
                ]
                for field in fields_to_pop:
                    col.pop(field)

                agent_schema = A2AAgentCard(
                    **col["json_data1"],
                    id=col["id"],
                    name=col["name"],
                    description=col["description"],
                    url=col["server_url"],
                )
                agent_card = a2a_repo.agent_card_to_dto(agent_card=agent_schema)

                response.append(agent_card)

            if agent_type == "agents":
                fields_to_pop = [
                    "server_url",
                ]
                for field in fields_to_pop:
                    col.pop(field)

                agent = ActiveGenAIAgentDTO(
                    agent_id=col["alias"],
                    agent_name=col["name"],
                    agent_description=col["description"],
                    agent_schema=col["json_data1"],
                    agent_jwt=col["jwt"],
                    agent_alias=col["alias"],
                    is_active=col["is_active"],
                    created_at=col["created_at"],
                    updated_at=col["updated_at"],
                )
                response.append(agent)

        return ActiveAgentsDTO(
            count_active_connections=len(response),
            active_connections=[resp_model.model_dump() for resp_model in response],
        )

    async def list_all_mcp_servers(
        self, db: AsyncSession, user_id: UUID, limit: int, offset: int
    ):
        return await mcp_repo.list_active_mcp_servers(
            db=db, user_id=user_id, limit=limit, offset=offset
        )

    async def list_all_a2a_cards(
        self, db: AsyncSession, user_id: UUID, limit: int, offset: int
    ):
        result = await a2a_repo.list_active_cards(
            db=db, user_id=user_id, limit=limit, offset=offset
        )
        return result

    async def get_active_agents_by_filter(
        self,
        db: AsyncSession,
        agent_type: ActiveAgentTypeFilter,
        user_id: UUID,
        limit: int,
        offset: int,
    ):
        if agent_type == agent_type.genai:
            return await self.list_all_agents(
                db=db, user_id=user_id, limit=limit, offset=offset
            )
        elif agent_type == agent_type.a2a:
            return await self.list_all_a2a_cards(
                db=db, user_id=user_id, limit=limit, offset=offset
            )
        elif agent_type == agent_type.mcp:
            return await self.list_all_mcp_servers(
                db=db, user_id=user_id, limit=limit, offset=offset
            )

        else:
            return await self.map_agents_to_dto_models(
                db=db, user_id=user_id, limit=limit, offset=offset
            )


agent_repo = AgentRepository(Agent)
