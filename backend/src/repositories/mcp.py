import logging
from datetime import timedelta
from typing import Optional
from uuid import UUID

import httpx
from fastapi import HTTPException
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
from mcp.shared.exceptions import McpError
from pydantic import AnyHttpUrl
from sqlalchemy import and_, select
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
from src.utils.helpers import mcp_tool_to_json_schema, prettify_integrity_error_details

logger = logging.getLogger(__name__)


async def lookup_mcp_server(
    url: str | AnyHttpUrl,
    headers: Optional[dict] = None,
    timeout: int = 60,
    cursor=None,
) -> Optional[MCPServerData]:
    """
    Function to lookup remote mcp server for tools, prompts, resources
    base_url must have an '/sse' endpoint.

    Returns:
        MCPServerData model with tools, prompts, resources
    """
    url = (
        f"{url.scheme}://{str(url.host)}{f':{url.port}' if url.port else ''}"
        if isinstance(url, AnyHttpUrl)
        else url[:-1]
    )
    try:
        async with streamablehttp_client(
            f"{url}/mcp",
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
                    is_active=True,
                )

    except* (OSError, httpx.ConnectError, McpError) as e:
        logger.warning(f"Could not connect to {url}. Details: {e.exceptions[0]}")

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

        return await self.update(db=db, db_obj=mcp_server, obj_in=obj_in)

    async def list_active_mcp_servers(
        self, db: AsyncSession, user_id: UUID, limit: int, offset: int
    ) -> list[MCPServerDTO]:
        q = await db.scalars(
            select(self.model)
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
        return [MCPServerDTO(**server.__dict__) for server in q.all()]

    async def list_remote_urls_of_all_servers(self, db: AsyncSession):
        q = await db.scalars(select(self.model.server_url))
        return [link[0] for link in q.all()]

    async def add_url(
        self, db: AsyncSession, data_in: MCPCreateServer, user_model: User
    ):
        try:
            mcp_server = await lookup_mcp_server(url=data_in.server_url)
            # mcp_server.mcp_tools = [mcp_tool_to_json_schema(t) for t in tools]

            if not mcp_server.is_active:
                raise HTTPException(
                    status_code=400,
                    detail=f"Could not access MCP server on: {data_in.server_url}. Make sure your MCP server supports 'sse' or 'streamable-http' protocols and is remotely accesible. Make sure to specify /mcp or /sse suffix depending on the protocol used by your server",  # noqa: E501
                )
        except* InvalidToolNameException as eg:  # noqa: F821
            res = eg.split(InvalidToolNameException)
            # exception group unpacking to retrieve the message of the exception
            message = str(res[0].exceptions[0].exceptions[0])
            raise HTTPException(
                detail=message,
                status_code=400,
            )

        server_url = str(data_in.server_url)

        # AnyHttpUrl always returns url with trailing slash,
        # trimming slash here to ensure consistency across all urls and to painlessly append suffixes like '/mcp'
        trimmed_url = server_url[:-1] if server_url.endswith("/") else server_url

        try:
            mcp_in = MCPServer(
                server_url=trimmed_url,
                creator_id=user_model.id,
                is_active=mcp_server.is_active,
            )
            db.add(mcp_in)
            await db.flush()
            await db.refresh(mcp_in)

            tools: list[Optional[MCPTool]] = []
            for tool in mcp_server.mcp_tools:
                tool_in = MCPTool(
                    name=tool.name,
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
            tools_json_schema_dto = [mcp_tool_to_json_schema(t) for t in tools_to_dto]
            return MCPServerDTO(
                server_url=mcp_in.server_url,
                mcp_tools=tools_json_schema_dto,
                is_active=mcp_in.is_active,
                created_at=mcp_in.created_at,
                updated_at=mcp_in.updated_at,
            )

        except IntegrityError as e:
            msg = str(e._message())
            detail = prettify_integrity_error_details(msg=msg)
            raise HTTPException(
                status_code=400,
                detail=f"{detail.column.capitalize()} - '{detail.value}' already exists",
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
        tools_dtos = []
        for s in q.all():
            tools = s.mcp_tools
            for t in tools:
                agent_schema = mcp_tool_to_json_schema(MCPToolDTO(**t.__dict__))
                tools_dtos.append(
                    AgentDTOPayload(
                        id=s.id,
                        name=agent_schema["title"],
                        type=AgentType.mcp,
                        url=s.server_url,
                        agent_schema=agent_schema,
                        created_at=s.created_at,
                        updated_at=s.updated_at,
                        is_active=s.is_active,
                    ).model_dump(exclude_none=True, mode="json")
                )
        return tools_dtos

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
        return tools


mcp_repo = MCPRepository(MCPServer)
