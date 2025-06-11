from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models import Agent


async def validate_all_agents_are_active_within_flow(
    db: AsyncSession, flow: list[Optional[dict[str, Any]]]
) -> bool:
    agent_ids = [agent["agent_id"] for agent in flow]
    q = await db.execute(select(Agent.is_active).where(Agent.id.in_(agent_ids)))
    return all(q.scalars().all())
