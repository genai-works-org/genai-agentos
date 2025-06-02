import logging
from typing import Optional
from uuid import UUID

from aiohttp import ClientSession
from fastapi import HTTPException
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models import A2ACard, User
from src.repositories.base import CRUDBase
from src.schemas.a2a.dto import A2ACardDTO
from src.schemas.a2a.schemas import (
    A2AAgentCard,
    A2AAgentCardSchema,
    A2ACreateAgentSchema,
)

logger = logging.getLogger(__name__)


async def lookup_agent_well_known(
    base_url: str, headers: Optional[dict] = None
) -> Optional[A2AAgentCardSchema]:
    async with ClientSession(base_url=base_url, headers=headers) as session:
        try:
            async with session.get("/.well-known/agent.json") as resp:
                if resp.status == 200:
                    json_resp = await resp.json()
                    card = A2AAgentCard(**json_resp)
                    return A2AAgentCardSchema(card=card, is_active=True)

                return None

        except OSError:
            logger.warning(f"Could not connect to agent on {base_url}")
            return A2AAgentCardSchema(is_active=False)


class A2ARepository(CRUDBase[A2ACard, A2AAgentCard, A2AAgentCard]):
    async def get_all_card_server_urls(self, db: AsyncSession) -> list[Optional[str]]:
        q = await db.scalars(select(self.model.server_url))
        return q.all()

    async def get_card_by_server_url(
        self, db: AsyncSession, server_url: str
    ) -> A2ACard:
        q = await db.scalars(
            select(self.model).where(self.model.server_url == server_url)
        )
        return q.first()

    async def update_card(
        self, db: AsyncSession, server_url: str, card_in: A2AAgentCardSchema
    ):
        card = await self.get_card_by_server_url(db=db, server_url=server_url)
        # obj_data = card.__dict__

        if card_in.card:
            setattr(card, "card_content", card_in.card.model_dump(mode="json"))
            setattr(card, "is_active", card_in.is_active)

            db.add(card)
            await db.commit()
            await db.refresh(card)
        return card

    async def add_url(
        self, db: AsyncSession, user_model: User, data_in: A2ACreateAgentSchema
    ):
        a2a_card_dto = await lookup_agent_well_known(base_url=str(data_in.server_url))
        if not a2a_card_dto.is_active:
            raise HTTPException(
                detail=f"Cannot retrieve data about a2a card on url: {data_in.server_url}",
                status_code=400,
            )

        a2a_card = a2a_card_dto.card
        # full card content, including name, descr, agent card url
        card_content = a2a_card.model_dump(mode="json")

        # values for separate columns
        card_name = card_content.pop("name")
        card_description = card_content.pop("description")
        card_url = card_content.pop("url")

        a2a_agent = A2ACard(
            name=card_name,
            description=card_description,
            server_url=card_url,
            card_content=card_content,
            creator_id=user_model.id,
            is_active=a2a_card_dto.is_active,
        )
        db.add(a2a_agent)
        await db.commit()
        await db.refresh(a2a_agent)
        return A2ACardDTO(
            id=a2a_agent.id,
            name=a2a_agent.name,
            description=a2a_agent.description,
            server_url=a2a_agent.server_url,
            card_content=a2a_agent.card_content,
        )

    async def list_active_cards(
        self, db: AsyncSession, user_id: UUID, limit: int, offset: int
    ):
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
        return [A2ACardDTO(**c.__dict__) for c in q.all()]


a2a_repo = A2ARepository(A2ACard)
