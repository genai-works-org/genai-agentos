import logging
from typing import Optional
from uuid import UUID

from genai_session.session import GenAISession
from genai_session.utils.naming_enums import ErrorType
from pydantic import ValidationError
from src.db.session import async_session
from src.models import Agent
from src.repositories.agent import agent_repo
from src.utils.validation_error_handler import validation_exception_handler

logger = logging.getLogger(__name__)


async def validate_agent_or_send_err(
    agent_uuid: str,
    session: GenAISession,
) -> Optional[Agent]:
    try:
        agent_uuid = str(UUID(agent_uuid))
        async with async_session() as db:
            # Check if the agent already exists
            existing_agent = await agent_repo.get(db=db, id_=agent_uuid)
            if existing_agent:
                logger.debug(f"Agent exists: {str(existing_agent.id)}")
                return existing_agent

            await session.send(
                message={
                    "error_message": "Agent ID was not registered before",
                    "error_type": ErrorType.AGENT_GENERAL_ERROR.value,
                },
                client_id=agent_uuid,
                close_timeout=1,
            )

    # TODO: query agent id that it belongs to user
    except ValueError:
        await session.send(
            message={
                "error_message": "Agent ID is not a valid UUID",
                "error_type": ErrorType.AGENT_UUID_ERROR.value,
            },
            client_id=agent_uuid,
            close_timeout=1,
        )
    except ValidationError as e:
        logger.error(
            f"Invalid agent_register event request schema. Details: {validation_exception_handler(e)}"
        )
        return


def is_valid_uuid(uuid: str) -> str | bool:
    try:
        return str(UUID(uuid))
    except ValueError:
        return False
