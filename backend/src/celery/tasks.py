import asyncio
import logging

from celery_singleton import Singleton
from src.celery.celery_app import celery_app
from src.utils.lookup_a2a_agent import lookup_a2a_agents
from src.utils.lookup_mcp_server import lookup_mcp_servers

logger = logging.getLogger(__name__)


async def refresh_mcp_a2a_data():
    tasks = [
        asyncio.create_task(lookup_mcp_servers()),
        asyncio.create_task(lookup_a2a_agents()),
    ]
    await asyncio.gather(*tasks)


@celery_app.task(base=Singleton, bind=True)
def singleton_mcp_a2a_lookup(self):
    asyncio.run(refresh_mcp_a2a_data())
