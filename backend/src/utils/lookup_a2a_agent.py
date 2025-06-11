import asyncio
import logging

from src.db.session import async_session
from src.repositories.a2a import a2a_repo, lookup_agent_well_known

logger = logging.getLogger(__name__)


async def lookup_and_update_agent_card(server_url: str, headers: dict = {}):
    async with async_session() as db:
        card_info = await lookup_agent_well_known(url=server_url, headers=headers)
        card = await a2a_repo.update_card(
            db=db, server_url=server_url, card_in=card_info
        )
        return card


async def lookup_a2a_agents(headers: dict = {}):
    async with async_session() as db:
        urls = await a2a_repo.get_all_card_server_urls(db)

    tasks = []
    for url in urls:
        tasks.append(
            asyncio.create_task(
                lookup_and_update_agent_card(server_url=url, headers=headers)
            )
        )

    cards = await asyncio.gather(*tasks)
    logger.info(f"Updated info about {len(cards)} A2A agents")

    return
