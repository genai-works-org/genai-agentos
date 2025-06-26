import asyncio
from typing import Awaitable, Callable

import pytest
import websockets
from genai_session.session import GenAISession

from tests.http_client.AsyncHTTPClient import AsyncHTTPClient
from tests.schemas import AgentDTOWithJWT

ENDPOINT = "/api/agents/"
AGENT_ID_ENDPOINT = "/api/agents/{agent_id}"

http_client = AsyncHTTPClient(timeout=10)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "offset, limit, displayed_agents",
    [(0, 1, 1), (0, 2, 1)],
    ids=[
        "valid offset and valid limit equal to agents amount",
        "valid offset and valid limit above agents amount",
    ],
)
async def test_agents_with_valid_offset_and_limit(
    offset,
    limit,
    displayed_agents,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    genai_agent_response_factory: Callable[[str, str, str, str], dict],
):
    dummy_agent = await agent_factory(user_jwt_token)

    session = GenAISession(jwt_token=dummy_agent.jwt)

    @session.bind(name=dummy_agent.name, description=dummy_agent.description)
    async def example_agent(agent_context=""):
        return True

    async def process_events():
        """Processes events for the GenAISession."""
        # logging.info(f"Agent with ID {JWT_TOKEN} started")
        await session.process_events()

    try:
        event_task = asyncio.create_task(process_events())

        await asyncio.sleep(0.1)

        params = {"offset": offset, "limit": limit}
        agents = await http_client.get(
            path=ENDPOINT,
            params=params,
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        assert len(agents) == displayed_agents, "Invalid amount of agents"

        # agent_id = agents[0].pop("agent_id")
        created_at = agents[0].pop("created_at")
        updated_at = agents[0].pop("updated_at")

        assert created_at
        assert updated_at

        expected_agents = [
            genai_agent_response_factory(
                dummy_agent.alias,
                dummy_agent.name,
                dummy_agent.description,
                dummy_agent.id,
                dummy_agent.jwt,
            )
        ]

        assert agents == expected_agents

    finally:
        event_task.cancel()

        try:
            await event_task

        except asyncio.CancelledError:
            pass
            # logging.info("Background task has been properly cancelled.")
        except websockets.exceptions.ConnectionClosedOK:
            pass


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "offset, limit, displayed_agents",
    [(0, 0, 0)],
    ids=["valid offset equals to limit, limit less then active agents amount"],
)
async def test_agents_with_valid_offset_and_limit_less_then_agents_amount(
    offset,
    limit,
    displayed_agents,
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
        # logging.info(f"Agent with ID {JWT_TOKEN} started")
        await session.process_events()

    try:
        event_task = asyncio.create_task(process_events())

        await asyncio.sleep(0.1)

        params = {"offset": offset, "limit": limit}
        agents = await http_client.get(
            path=ENDPOINT,
            params=params,
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        assert len(agents) == displayed_agents, "Invalid amount of agents"

        expected_agents = []

        assert agents == expected_agents

    finally:
        event_task.cancel()

        try:
            await event_task

        except asyncio.CancelledError:
            # logging.info("Background task has been properly cancelled.")
            pass
        except websockets.exceptions.ConnectionClosedOK:
            pass


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "offset, limit, displayed_agents",
    [(1, 1, 0)],
    ids=["valid offset and limit equal to agents amount"],
)
async def test_agents_with_valid_offset_and_limit_equal_to_agents_amount(
    offset,
    limit,
    displayed_agents,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    clean_genai_agents_table,
):
    dummy_agent = await agent_factory(user_jwt_token)
    JWT_TOKEN = dummy_agent.jwt

    session = GenAISession(jwt_token=JWT_TOKEN)

    @session.bind(name=dummy_agent.name, description=dummy_agent.description)
    async def example_agent(agent_context=""):
        return True

    async def process_events():
        """Processes events for the GenAISession."""
        # logging.info(f"Agent with ID {JWT_TOKEN} started")
        await session.process_events()

    try:
        event_task = asyncio.create_task(process_events())

        await asyncio.sleep(0.1)

        params = {"offset": offset, "limit": limit}
        agents = await http_client.get(
            path=ENDPOINT,
            params=params,
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        assert len(agents) == displayed_agents, "Invalid amount of agents"

        expected_agents = []

        assert agents == expected_agents

    finally:
        event_task.cancel()

        try:
            await event_task

        except asyncio.CancelledError:
            # logging.info("Background task has been properly cancelled.")
            pass
        except websockets.exceptions.ConnectionClosedOK:
            pass


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "offset, limit, displayed_agents",
    [(1, 1, 1)],
    ids=["offset and limit are equal and less then active agents amount"],
)
async def test_agents_with_offset_and_limit_are_equal_and_less_then_agents_amount(
    offset,
    limit,
    displayed_agents,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
):
    dummy_agent1 = await agent_factory(user_jwt_token)
    dummy_agent2 = await agent_factory(user_jwt_token)
    AUTH_JWT_1 = dummy_agent1.jwt
    AUTH_JWT_2 = dummy_agent2.jwt

    session_1 = GenAISession(jwt_token=AUTH_JWT_1)
    session_2 = GenAISession(jwt_token=AUTH_JWT_2)

    @session_1.bind(name=dummy_agent1.name, description=dummy_agent1.description)
    async def example_agent_1(agent_context=""):
        return True

    @session_2.bind(name=dummy_agent2.name, description=dummy_agent2.description)
    async def example_agent_2(agent_context=""):
        return False

    async def process_event_1():
        """Processes events for the GenAISession."""
        # logging.info(f"Agents with ID {AUTH_JWT_1} started")
        await asyncio.gather(session_1.process_events())

    async def process_event_2():
        """Processes events for the GenAISession."""
        # logging.info(f"Agents with ID {AUTH_JWT_2} started")
        await asyncio.gather(session_2.process_events())

    try:
        event_task_1 = asyncio.create_task(process_event_1())

        await asyncio.sleep(0.1)

        event_task_2 = asyncio.create_task(process_event_2())

        await asyncio.sleep(0.1)

        event_tasks = [event_task_1, event_task_2]

        params = {"offset": offset, "limit": limit}
        agents = await http_client.get(
            path=ENDPOINT,
            params=params,
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        assert len(agents) == displayed_agents

        created_at = agents[0].pop("created_at")
        updated_at = agents[0].pop("updated_at")

        assert created_at
        assert updated_at

    finally:
        for task in event_tasks:
            task.cancel()

            try:
                await task

            except asyncio.CancelledError:
                # logging.info("Background task has been properly cancelled.")
                pass


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "offset, limit, displayed_agents",
    [(0, 3, 2)],
    ids=["valid offset and valid limit above active agents amount"],
)
async def test_agents_offset_and_limit_above_agents_amount(
    offset,
    limit,
    displayed_agents,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
):
    agent1 = await agent_factory(user_jwt_token)
    agent2 = await agent_factory(user_jwt_token)

    AUTH_JWT_1 = agent1.jwt
    AUTH_JWT_2 = agent2.jwt

    session_1 = GenAISession(jwt_token=AUTH_JWT_1)
    session_2 = GenAISession(jwt_token=AUTH_JWT_2)

    @session_1.bind(name=agent1.name, description=agent1.description)
    async def example_agent_1(agent_context=""):
        return True

    @session_2.bind(name=agent2.name, description=agent2.description)
    async def example_agent_2(agent_context=""):
        return False

    async def process_event_1():
        """Processes events for the GenAISession."""
        # logging.info(f"Agents with ID {AUTH_JWT_1} started")
        await session_1.process_events()

    async def process_event_2():
        """Processes events for the GenAISession."""
        # logging.info(f"Agents with ID {AUTH_JWT_2} started")
        await session_2.process_events()

    try:
        event_task_1 = asyncio.create_task(process_event_1())
        await asyncio.sleep(0.1)

        event_task_2 = asyncio.create_task(process_event_2())
        await asyncio.sleep(0.1)

        event_tasks = [event_task_1, event_task_2]

        params = {"offset": offset, "limit": limit}
        agents = await http_client.get(
            path=ENDPOINT,
            params=params,
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        assert len(agents) == displayed_agents

        # agent_id_1 = agents[0].pop("agent_id")
        created_at_1 = agents[0].pop("created_at")
        updated_at_1 = agents[0].pop("updated_at")

        # assert created_at_1 == updated_at_1
        assert created_at_1
        assert updated_at_1

        # agent_id_2 = agents[1].pop("agent_id")
        created_at_2 = agents[1].pop("created_at")
        updated_at_2 = agents[1].pop("updated_at")

        # assert created_at_2 == updated_at_2
        assert created_at_2
        assert updated_at_2

    finally:
        for task in event_tasks:
            task.cancel()

            try:
                await task

            except asyncio.CancelledError:
                # logging.info("Background task has been properly cancelled.")
                pass


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "offset, limit, displayed_agents",
    [(0, 1, 0)],
    ids=["valid offset and valid limit with no active agents"],
)
async def test_agents_with_valid_offset_and_limit_and_no_active_agents(
    offset, limit, displayed_agents, user_jwt_token, clean_genai_agents_table
):
    await asyncio.sleep(3)

    params = {"offset": offset, "limit": limit}
    agents = await http_client.get(
        path=ENDPOINT,
        params=params,
        headers={"Authorization": f"Bearer {user_jwt_token}"},
    )

    assert len(agents) == displayed_agents

    expected_agents = []

    assert agents == expected_agents


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "displayed_agents", [1], ids=["default offset and limit with active agent"]
)
async def test_agents_with_default_offset_and_limit_with_agent(
    displayed_agents,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    genai_agent_response_factory: Callable[[str, str, str, str], dict],
):
    agent = await agent_factory(user_jwt_token)
    AUTH_JWT = agent.jwt

    session = GenAISession(jwt_token=AUTH_JWT)

    @session.bind(name=agent.name, description=agent.description)
    async def example_agent(agent_context=""):
        return True

    async def process_events():
        """Processes events for the GenAISession."""
        # logging.info(f"Agent with ID {JWT_TOKEN} started")
        await session.process_events()

    try:
        event_task = asyncio.create_task(process_events())

        await asyncio.sleep(0.1)

        agents = await http_client.get(
            path=ENDPOINT,
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        assert len(agents) == displayed_agents, "Invalid amount of agents"

        created_at = agents[0].pop("created_at")
        updated_at = agents[0].pop("updated_at")

        # assert created_at == updated_at
        assert created_at
        assert updated_at

        expected_agents = [
            genai_agent_response_factory(
                agent.alias, agent.name, agent.description, agent.id, agent.jwt
            ),
        ]

        assert agents == expected_agents

    finally:
        event_task.cancel()

        try:
            await event_task

        except asyncio.CancelledError:
            # logging.info("Background task has been properly cancelled.")
            pass


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "offset, limit, param, error_msg",
    [
        (
            0.1,
            1,
            "offset",
            "Input should be a valid integer, unable to parse string as an integer",
        ),
        (
            "zero",
            1,
            "offset",
            "Input should be a valid integer, unable to parse string as an integer",
        ),
        (
            "",
            1,
            "offset",
            "Input should be a valid integer, unable to parse string as an integer",
        ),
    ],
    ids=[
        "float offset",
        "string offset",
        "empty string offset",
    ],
)
async def test_agents_with_invalid_params_offset(
    offset,
    limit,
    param,
    error_msg,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
):
    agent = await agent_factory(user_jwt_token)

    JWT_TOKEN = agent.jwt

    session = GenAISession(jwt_token=JWT_TOKEN)

    @session.bind(name=agent.name, description=agent.description)
    async def example_agent(agent_context=""):
        return True

    async def process_events():
        """Processes events for the GenAISession."""
        # logging.info(f"Agent with ID {JWT_TOKEN} started")
        await session.process_events()

    try:
        event_task = asyncio.create_task(process_events())

        await asyncio.sleep(0.1)

        params = {"offset": offset, "limit": limit}
        respounse = await http_client.get(
            ENDPOINT,
            params=params,
            expected_status_codes=[422],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        expected_respounse = {
            "detail": [
                {
                    "type": "int_parsing",
                    "loc": ["query", f"{param}"],
                    "msg": f"{error_msg}",
                    "input": f"{offset}",
                }
            ]
        }

        assert respounse == expected_respounse

    finally:
        event_task.cancel()

        try:
            await event_task

        except asyncio.CancelledError:
            # logging.info("Background task has been properly cancelled.")
            pass


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "offset, limit, param, error_msg",
    [
        (
            1,
            0.1,
            "limit",
            "Input should be a valid integer, unable to parse string as an integer",
        ),
        (
            1,
            "one",
            "limit",
            "Input should be a valid integer, unable to parse string as an integer",
        ),
        (
            1,
            "",
            "limit",
            "Input should be a valid integer, unable to parse string as an integer",
        ),
    ],
    ids=[
        "float limit",
        "string limit",
        "empty string limit",
    ],
)
async def test_agents_with_invalid_params_limit(
    offset,
    limit,
    param,
    error_msg,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
):
    agent = await agent_factory(user_jwt_token)

    JWT_TOKEN = agent.jwt

    session = GenAISession(jwt_token=JWT_TOKEN)

    @session.bind(name=agent.name, description=agent.description)
    async def example_agent(agent_context=""):
        return True

    async def process_events():
        """Processes events for the GenAISession."""
        # logging.info(f"Agent with ID {JWT_TOKEN} started")
        await session.process_events()

    try:
        event_task = asyncio.create_task(process_events())

        await asyncio.sleep(0.1)

        params = {"offset": offset, "limit": limit}
        respounse = await http_client.get(
            ENDPOINT,
            params=params,
            expected_status_codes=[422],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        expected_respounse = {
            "detail": [
                {
                    "type": "int_parsing",
                    "loc": ["query", f"{param}"],
                    "msg": f"{error_msg}",
                    "input": f"{limit}",
                }
            ]
        }

        assert respounse == expected_respounse

    finally:
        event_task.cancel()

        try:
            await event_task

        except asyncio.CancelledError:
            pass
            # logging.info("Background task has been properly cancelled.")
