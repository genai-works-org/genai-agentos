import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from aiohttp import ClientSession
from fastapi import HTTPException
from sqlalchemy import and_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from src.models import A2ACard, User
from src.repositories.base import CRUDBase
from src.schemas.a2a.dto import A2ACardDTO
from src.schemas.a2a.schemas import (
    A2AAgentCard,
    A2AAgentCardSchema,
    A2ACreateAgentSchema,
    A2AJsonSchema,
)
from src.schemas.base import AgentDTOPayload
from src.utils.enums import AgentType
from src.utils.helpers import (
    generate_alias,
    get_agent_description_from_skills,
    prettify_integrity_error_details,
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
        try:
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
            return AgentDTOPayload(
                id=a2a_agent.id,
                name=a2a_agent.name,
                type=AgentType.a2a,
                agent_schema=card_content,
                created_at=a2a_agent.created_at,
                updated_at=a2a_agent.updated_at,
                is_active=a2a_agent.is_active,
            ).model_dump(mode="json", exclude_none=True)

        except IntegrityError as e:
            msg = str(e._message())
            detail = prettify_integrity_error_details(msg=msg)
            raise HTTPException(
                status_code=400,
                detail=f"{detail.column.capitalize()} - '{detail.value}' already exists",
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
        cards = [A2ACardDTO(**c.__dict__) for c in q.all()]
        return [
            a2a_repo.agent_card_to_dto(
                agent_card=A2AAgentCard(
                    **c.card_content,
                    name=c.name,
                    description=c.description,
                    url=c.server_url,
                ),
                created_at=c.created_at,
                updated_at=c.updated_at,
                id_=c.id,
            )
            for c in cards
        ]

    @staticmethod
    def _agent_card_to_json_schema(agent_card: A2AAgentCard):
        return A2AJsonSchema(
            title=generate_alias(agent_card.name.strip()),
            description=get_agent_description_from_skills(
                agent_card.description,
                [s.model_dump(mode="json") for s in agent_card.skills],
            ),
        )

    def agent_card_to_dto(
        self,
        agent_card: A2AAgentCard,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        id_: Optional[UUID | str] = None,
    ):
        json_schema = self._agent_card_to_json_schema(agent_card=agent_card)
        title = json_schema.title
        return AgentDTOPayload(
            id=id_ if id_ else title,
            name=title,
            type=AgentType.a2a,
            url=agent_card.url,
            agent_schema=json_schema.model_dump(mode="json", exclude_none=True),
            created_at=created_at,
            updated_at=updated_at,
            is_active=True,
        )


a2a_repo = A2ARepository(A2ACard)
