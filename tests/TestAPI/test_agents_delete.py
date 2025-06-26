import asyncio
import logging
import uuid
from typing import Awaitable, Callable

import pytest
from genai_session.session import GenAISession

from tests.http_client.AsyncHTTPClient import AsyncHTTPClient
from tests.schemas import AgentDTOWithJWT

ENDPOINT = "/api/agents/{agent_id}"

http_client = AsyncHTTPClient(timeout=10)


@pytest.mark.asyncio
async def test_agents_delete_active_agent(
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
):
    dummy_agent = await agent_factory(user_jwt_token)

    JWT_TOKEN = dummy_agent.jwt

    session = GenAISession(jwt_token=JWT_TOKEN)

    @session.bind(name=dummy_agent.name, description=dummy_agent.description)
    async def example_agent(agent_context=""):
        return True

    async def process_events():
        """Processes events for the GenAISession."""
        # logging.info(f"Agent with ID {agent_id} started")
        await session.process_events()

    try:
        event_task = asyncio.create_task(process_events())

        await asyncio.sleep(0.3)

        await http_client.delete(
            path=ENDPOINT.format(agent_id=session.agent_id),
            expected_status_codes=[204],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

    finally:
        event_task.cancel()

        try:
            await event_task

        except asyncio.CancelledError:
            logging.info("Background task has been properly cancelled.")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "agent_id",
    [str(uuid.uuid4())],
    ids=[
        "delete agent using invalid agent_id",
    ],
)
async def test_agents_delete_agent_using_invalid_agent_id(
    agent_id,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
):
    dummy_agent = await agent_factory(user_jwt_token)

    JWT_TOKEN = dummy_agent.jwt

    session = GenAISession(jwt_token=JWT_TOKEN)

    @session.bind(name=dummy_agent.name, description=dummy_agent.name)
    async def example_agent(agent_context=""):
        return True

    async def process_events():
        """Processes events for the GenAISession."""
        # logging.info(f"Agent with ID {agent_id} started")
        await session.process_events()

    try:
        event_task = asyncio.create_task(process_events())

        await asyncio.sleep(0.3)

        await http_client.delete(
            path=ENDPOINT.format(agent_id=agent_id[:-1]),
            expected_status_codes=[422],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

    finally:
        event_task.cancel()

        try:
            await event_task

        except asyncio.CancelledError:
            logging.info("Background task has been properly cancelled.")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "agent_id",
    [str(uuid.uuid4())],
    ids=[
        "delete agent using wrong agent_id",
    ],
)
async def test_agents_delete_agent_using_wrong_agent_id(
    agent_id,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
):
    dummy_agent = await agent_factory(user_jwt_token)

    JWT_TOKEN = dummy_agent.jwt

    session = GenAISession(jwt_token=JWT_TOKEN)

    @session.bind(name=dummy_agent.name, description=dummy_agent.description)
    async def example_agent(agent_context=""):
        return True

    async def process_events():
        """Processes events for the GenAISession."""
        # logging.info(f"Agent with ID {agent_id} started")
        await session.process_events()

    try:
        event_task = asyncio.create_task(process_events())

        await asyncio.sleep(0.3)

        await http_client.delete(
            path=ENDPOINT.format(agent_id=agent_id),
            expected_status_codes=[400],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

    finally:
        event_task.cancel()

        try:
            await event_task

        except asyncio.CancelledError:
            logging.info("Background task has been properly cancelled.")
