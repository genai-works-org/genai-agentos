import asyncio
import logging

from src.db.session import async_session
from src.repositories.mcp import lookup_mcp_server, mcp_repo

logger = logging.getLogger(__name__)


async def lookup_and_update_mcp_server(url: str, headers={}, cursor=None):
    data = await lookup_mcp_server(url=url, headers=headers, cursor=cursor)
    if data:
        async with async_session() as db:
            return await mcp_repo.update_mcp_server_resources(
                db=db, mcp_server_url=url, obj_in=data
            )


async def lookup_mcp_servers():
    async with async_session() as db:
        urls: list[str] = await mcp_repo.list_remote_urls_of_all_servers(db=db)
        tasks = []

        for url in urls:
            task = asyncio.create_task(lookup_and_update_mcp_server(url=url))
            tasks.append(task)

        results = await asyncio.gather(*tasks)
        logger.info(f"Updated info about {len(results)} MCP servers")
    return
