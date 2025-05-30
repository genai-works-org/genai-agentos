import logging
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from mcp import ClientSession
from mcp.client.sse import sse_client
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models import MCPServer, User
from src.repositories.base import CRUDBase
from src.schemas.mcp.dto import MCPServerDTO
from src.schemas.mcp.schemas import MCPCreateServer, MCPServerData, MCPToolSchema

logger = logging.getLogger(__name__)


async def lookup_mcp_server(
    url: str, headers: dict = {}, cursor=None
) -> Optional[MCPServerData]:
    """
    Function to lookup remote mcp server for tools, prompts, resources
    base_url must have an '/sse' endpoint.

    Returns:
        MCPServerData model with tools, prompts, resources
    """
    # TODO: extend url with /sse, but test behaviour when user changes mount_point on MCP server side
    try:
        async with sse_client(
            url if isinstance(url, str) else str(url), headers=headers
        ) as streams:
            async with ClientSession(*streams) as session:
                logger.debug(f"Initializing conn with MCP server: {url}")
                await session.initialize()

                tools = await session.list_tools()
                prompts = await session.list_prompts()
                resources = await session.list_resources()
                logger.debug(f"Successfully got the mcp server data of: {url}")

                return MCPServerData(
                    mcp_tools=[tool.model_dump(mode="json") for tool in tools.tools],
                    mcp_prompts=[
                        prompt.model_dump(mode="json") for prompt in prompts.prompts
                    ],
                    mcp_resources=[
                        resource.model_dump(mode="json")
                        for resource in resources.resources
                    ],
                    is_active=True,
                )

    except ExceptionGroup:  # noqa: F821
        logger.warning(f"Could not connect to {url}")
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
        mcp_server = await lookup_mcp_server(url=data_in.server_url)
        if not mcp_server.is_active:
            raise HTTPException(
                status_code=400,
                detail=f"Could not access MCP server on: {data_in.server_url}. Make sure your MCP server supports 'sse' or 'streamable-http' protocols and is remotely accesible",  # noqa: E501
            )

        mcp_in = MCPServer(
            name=data_in.name,
            description=data_in.description,
            server_url=str(data_in.server_url),
            mcp_tools=mcp_server.mcp_tools,
            mcp_prompts=mcp_server.mcp_prompts,
            mcp_resources=mcp_server.mcp_resources,
            creator_id=user_model.id,
            is_active=mcp_server.is_active,
        )
        db.add(mcp_in)
        await db.commit()
        await db.refresh(mcp_in)
        return mcp_in


mcp_repo = MCPRepository(MCPServer)
