import logging
import traceback
import uuid
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

import httpx
from fastapi import HTTPException
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
from mcp.shared.exceptions import McpError
from pydantic import AnyHttpUrl
from sqlalchemy import and_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.models import MCPServer, MCPTool, User
from src.repositories.base import CRUDBase
from src.schemas.base import AgentDTOPayload
from src.schemas.mcp.dto import MCPServerDTO, MCPToolDTO
from src.schemas.mcp.schemas import MCPCreateServer, MCPServerData, MCPToolSchema
from src.utils.enums import AgentType
from src.utils.exceptions import InvalidToolNameException
from src.utils.helpers import generate_alias, mcp_tool_to_json_schema

logger = logging.getLogger(__name__)


async def lookup_mcp_server(
    url: str | AnyHttpUrl,
    headers: Optional[dict] = None,
    timeout: int = 60,
    cursor=None,
) -> MCPServerData:
    """
    Function to lookup remote mcp server for tools, prompts, resources
    base_url must have publicly accessible and support 'streamable-http' protocol.

    Returns:
        MCPServerData model with tools, prompts, resources
    """
    # During initial lookup of the server (during POST request to add a MCP server)
    # `url` will be of type AnyHttpUrl, which is used here to construct a base_url for the server

    # `url` will be of string type only whenever celery beat task will invoke this lookup function.
    # In this case, trailing slash is trimmed
    try:
        async with streamablehttp_client(
            url=str(url),
            headers=headers,
            timeout=timedelta(seconds=timeout),
        ) as (read_stream, write_stream, _):
            async with ClientSession(
                write_stream=write_stream, read_stream=read_stream
            ) as session:
                logger.debug(f"Initializing conn with MCP server: {url}")
                await session.initialize()

                tools = await session.list_tools()

                logger.debug(f"Successfully got the mcp server data of: {url}")

                return MCPServerData(
                    mcp_tools=tools.tools,
                    server_url=str(url),
                    is_active=True,
                )

    except* (OSError, httpx.ConnectError, httpx.HTTPStatusError, McpError):
        logger.warning(f"Could not connect to {url}. Details: {traceback.format_exc()}")

    return MCPServerData(is_active=False)


class MCPRepository(CRUDBase[MCPServer, MCPToolSchema, MCPToolSchema]):
    async def get_mcp_server_by_url(self, db: AsyncSession, mcp_server_url: str):
        q = await db.scalars(
            select(self.model).where(
                and_(
                    self.model.server_url == mcp_server_url,
                )
            )
        )
        return q.first()

    async def update_mcp_server_with_tools(
        self, db: AsyncSession, db_obj: MCPServer, obj_in: MCPServerData
    ):
        tools_in = obj_in.mcp_tools
        tool_names = [t.name for t in tools_in]

        q = await db.scalars(
            select(MCPTool)
            .where(
                and_(MCPTool.name.in_(tool_names), MCPTool.mcp_server_id == db_obj.id)
            )
            .order_by(MCPTool.created_at.desc())
        )

        tool_alias_container = {
            t.name: {"id": t.id, "alias": t.alias}
            for t in q.all()
            if t.name in tool_names
        }

        tools_batch = [
            {
                **t.model_dump(mode="json"),
                "id": tool_alias_container.get(t.name, {}).get("id", str(uuid.uuid4())),
                "alias": tool_alias_container.get(t.name, {}).get(
                    "alias", generate_alias(t.name)
                ),
                "mcp_server_id": db_obj.id,
                "updated_at": datetime.now(),
            }
            for t in tools_in
        ]

        await db.run_sync(
            lambda sync_db: sync_db.bulk_update_mappings(MCPTool, tools_batch)
        )
        await db.commit()
        await db.refresh(db_obj)

        db_obj.is_active = True
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_mcp_server_resources(
        self,
        db: AsyncSession,
        mcp_server_url: str,
        obj_in: MCPServerData,
    ):
        mcp_server = await self.get_mcp_server_by_url(
            db=db, mcp_server_url=mcp_server_url
        )
        if not mcp_server:
            return None

        return await self.update_mcp_server_with_tools(
            db=db, db_obj=mcp_server, obj_in=obj_in
        )

    async def set_as_inactive(self, db: AsyncSession, server_url: str):
        await db.execute(
            update(self.model)
            .where(self.model.server_url == server_url)
            .values({"is_active": False})
        )
        await db.commit()
        logger.info(f"Set {server_url} as inactive")

    async def list_active_mcp_servers(
        self, db: AsyncSession, user_id: UUID, limit: int, offset: int
    ) -> list[MCPServerDTO]:
        q = await db.scalars(
            select(self.model)
            .options(selectinload(self.model.mcp_tools))
            .where(
                and_(
                    self.model.is_active == True,  # noqa: E712
                    self.model.creator_id == user_id,
                )
            )
            .order_by(self.model.created_at.desc())
            .limit(limit=limit)
            .offset(offset=offset)
        )
        servers = q.all()
        dto = []
        for s in servers:
            tools = []
            for t in s.mcp_tools:
                tools.append(MCPToolDTO(**t.__dict__))

            dto.append(
                MCPServerDTO(
                    server_url=s.server_url,
                    mcp_tools=tools,
                    is_active=s.is_active,
                    created_at=s.created_at,
                    updated_at=s.updated_at,
                )
            )
        return dto

    async def list_remote_urls_of_all_servers(self, db: AsyncSession):
        q = await db.scalars(select(self.model.server_url))
        return q.all()

    async def add_url(
        self, db: AsyncSession, data_in: MCPCreateServer, user_model: User
    ):
        user_id = str(user_model.id)
        try:
            mcp_server = await lookup_mcp_server(url=data_in.server_url)

            if not mcp_server.is_active:
                raise HTTPException(
                    status_code=400,
                    detail=f"Could not access MCP server on: {data_in.server_url}. Make sure your MCP server supports 'streamable-http' protocol and is remotely accesible.",  # noqa: E501
                )
        except* InvalidToolNameException as eg:  # noqa: F821
            res = eg.split(InvalidToolNameException)
            # exception group unpacking to retrieve the message of the exception
            message = str(res[0].exceptions[0].exceptions[0])
            raise HTTPException(
                detail=message,
                status_code=400,
            )

        server_url = str(mcp_server.server_url)

        try:
            mcp_in = MCPServer(
                server_url=server_url,
                creator_id=user_id,
                is_active=mcp_server.is_active,
            )
            db.add(mcp_in)
            await db.flush()
            await db.refresh(mcp_in)

            tools: list[Optional[MCPTool]] = []
            for tool in mcp_server.mcp_tools:
                aliased_name = generate_alias(tool.name)
                tool_in = MCPTool(
                    name=tool.name,
                    alias=aliased_name,
                    description=tool.description,
                    inputSchema=tool.inputSchema,
                    annotations=tool.annotations.model_dump(mode="json")
                    if tool.annotations
                    else None,
                    mcp_server_id=mcp_in.id,
                )
                db.add(tool_in)
                tools.append(tool_in)

            await db.commit()
            await db.refresh(mcp_in)
            for tool in tools:
                await db.refresh(tool)
            tools_to_dto = [MCPToolDTO(**t.__dict__) for t in tools]
            tools_json_schema_dto = [
                mcp_tool_to_json_schema(t, aliased_title=t.alias) for t in tools_to_dto
            ]
            return MCPServerDTO(
                server_url=mcp_in.server_url,
                mcp_tools=tools_json_schema_dto,
                is_active=mcp_in.is_active,
                created_at=mcp_in.created_at,
                updated_at=mcp_in.updated_at,
            )

        except IntegrityError:
            await db.rollback()
            return await self.update_server_is_active_state(
                db=db, user_model=user_model, mcp_server_data=mcp_server
            )

    async def update_server_is_active_state(
        self, db: AsyncSession, user_id: str, mcp_server_data: MCPServerData
    ):
        server = await db.scalar(
            select(self.model)
            .options(selectinload(self.model.mcp_tools))
            .where(
                and_(
                    self.model.creator_id == user_id,
                    self.model.server_url == mcp_server_data.server_url,
                )
            )
        )
        server.is_active = mcp_server_data.is_active
        await db.commit()
        await db.refresh(server)
        tools_to_dto = [MCPToolDTO(**t.__dict__) for t in server.mcp_tools]
        tools_json_schema_dto = [
            mcp_tool_to_json_schema(t, aliased_title=t.alias) for t in tools_to_dto
        ]
        return MCPServerDTO(
            server_url=mcp_server_data.server_url,
            mcp_tools=tools_json_schema_dto,
            is_active=mcp_server_data.is_active,
            created_at=server.created_at,
            updated_at=server.updated_at,
        )

    async def get_all_mcp_tools_of_all_servers(
        self, db: AsyncSession, user_model: User, limit: int, offset: int
    ):
        q = await db.scalars(
            select(self.model)
            .options(selectinload(self.model.mcp_tools))
            .where(
                and_(
                    self.model.creator_id == user_model.id,
                    self.model.is_active == True,  # noqa: E712
                )
            )
            .order_by(self.model.created_at)
            .limit(limit=limit)
            .offset(offset=offset)
        )

        return q.all()

    async def get_all_mcp_tools_from_single_server(
        self, db: AsyncSession, user_model: User, id_: UUID
    ):
        s = await db.scalar(
            select(self.model)
            .options(selectinload(self.model.mcp_tools))
            .where(self.model.creator_id == user_model.id, self.model.id == id_)
        )
        if not s:
            raise HTTPException(
                status_code=400, detail=f"MCP server with id: {str(id_)} was not found"
            )
        tools = []
        for t in s.mcp_tools:
            agent_schema = mcp_tool_to_json_schema(MCPToolDTO(**t.__dict__))
            tools.append(
                AgentDTOPayload(
                    id=t.id,
                    name=agent_schema["title"],
                    type=AgentType.mcp,
                    url=s.server_url,
                    agent_schema=agent_schema,
                    created_at=s.created_at,
                    updated_at=s.updated_at,
                    is_active=s.is_active,
                ).model_dump(mode="json", exclude_none=True)
            )
        return s

    async def get_tool_by_id(self, db: AsyncSession, id_: UUID):
        q = await db.scalar(select(MCPTool).where(MCPTool.id == id_))
        return q


mcp_repo = MCPRepository(MCPServer)
