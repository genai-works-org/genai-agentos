import asyncio
from datetime import datetime
from typing import Awaitable, Callable

import pytest
from genai_session.session import GenAISession

from tests.http_client.AsyncHTTPClient import AsyncHTTPClient
from tests.schemas import AgentDTOPayload, AgentDTOWithJWT, AgentType

ENDPOINT = "/api/agents/active"
http_client = AsyncHTTPClient(timeout=10)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "offset, limit, expected_active_connections",
    [(0, 3, 3)],
    ids=[
        "valid offset less then limit, valid limit equals to active agents amount",
    ],
)
async def test_active_agents_with_valid_limit_and_offset(
    offset,
    limit,
    expected_active_connections,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    registered_a2a_card: dict,
    active_genai_agent_response_factory: Callable[[str, str, str, str, str, str], dict],
    active_agent_factory: Callable[
        [str, str, AgentType, str, dict, bool, datetime, datetime], AgentDTOPayload
    ],
    a2a_server_url: str,
    registered_mcp_tools: list[AgentDTOPayload],
):
    dummy_agent = await agent_factory(user_jwt_token)
    a2a_card = registered_a2a_card

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

        params = {"offset": offset, "limit": limit, "agent_type": "all"}
        active_agents = await http_client.get(
            path=ENDPOINT,
            params=params,
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        # the order of the connections in test suite is based on the execution order
        # of the autouse=True fixtures in conftest, currently it is: genai - a2a - mcp tools
        active_connections = [
            active_genai_agent_response_factory(
                dummy_agent.alias,
                dummy_agent.name,
                dummy_agent.description,
                dummy_agent.id,
                dummy_agent.jwt,
                dummy_agent.created_at,
                active_agents["active_connections"][0]["updated_at"],
            ),
        ]
        active_connections.extend(registered_mcp_tools)
        active_connections.append(
            await active_agent_factory(
                a2a_card["id"],
                a2a_card["alias"],
                AgentType.a2a,
                a2a_server_url,
                a2a_card["agent_schema"],
                a2a_card["is_active"],
                a2a_card["created_at"],
                a2a_card["updated_at"],
            ),
        )
        expected_active_agents = {
            "count_active_connections": expected_active_connections,
            "active_connections": active_connections,
        }

        assert active_agents == expected_active_agents

    finally:
        event_task.cancel()

        try:
            await event_task

        except asyncio.CancelledError:
            # logging.info("Background task has been properly cancelled.")
            pass


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "offset, limit, expected_active_connections",
    [(0, 0, 0)],
    ids=["valid offset equals to limit, limit less then active agents amount"],
)
async def test_active_agents_with_limit_less_then_active_agents_amount(
    offset,
    limit,
    expected_active_connections,
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

        params = {"offset": offset, "limit": limit, "agent_type": "all"}
        active_agents = await http_client.get(
            path=ENDPOINT,
            params=params,
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        expected_active_agents = {
            "count_active_connections": expected_active_connections,
            "active_connections": [],
        }

        assert active_agents == expected_active_agents

    finally:
        event_task.cancel()

        try:
            await event_task

        except asyncio.CancelledError:
            # logging.info("Background task has been properly cancelled.")
            pass


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "offset, limit, expected_active_connections",
    [(3, 1, 0)],
    ids=["valid offset equals to limit and active agents amount"],
)
async def test_active_agents_with_offset_equal_to_active_agents_amount(
    offset,
    limit,
    expected_active_connections,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
):
    """
    3 agents/tools are created in conftest - genai agent, mcp tool, a2a card, hence offset=3
    """
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

        params = {"offset": offset, "limit": limit, "agent_type": "all"}
        active_agents = await http_client.get(
            path=ENDPOINT,
            params=params,
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        expected_active_agents = {
            "count_active_connections": expected_active_connections,
            "active_connections": [],
        }

        assert active_agents == expected_active_agents

    finally:
        event_task.cancel()

        try:
            await event_task

        except asyncio.CancelledError:
            # logging.info("Background task has been properly cancelled.")
            pass


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "offset, limit, expected_active_connections",
    [(1, 1, 1)],
    ids=["offset and limit are equal and less then active agents amount"],
)
async def test_active_agents_with_offset_and_limit_are_equal_and_less_then_active_agents_amount(
    offset,
    limit,
    expected_active_connections,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    registered_mcp_tools: list[AgentDTOPayload],
):
    dummy_agent_1 = await agent_factory(user_jwt_token)

    AUTH_JWT_1 = dummy_agent_1.jwt

    session_1 = GenAISession(jwt_token=AUTH_JWT_1)

    @session_1.bind(name=dummy_agent_1.name, description=dummy_agent_1.description)
    async def example_agent_1(agent_context=""):
        return True

    async def process_event_1():
        """Processes events for the GenAISession."""
        # logging.info(f"Agents with ID {AUTH_JWT_1} started")
        await session_1.process_events()

    try:
        event_task_1 = asyncio.create_task(process_event_1())
        await asyncio.sleep(0.1)

        event_tasks = [event_task_1]

        params = {"offset": offset, "limit": limit, "agent_type": "all"}
        active_agents = await http_client.get(
            path=ENDPOINT,
            params=params,
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        expected_active_agents = {
            "count_active_connections": expected_active_connections,
            "active_connections": registered_mcp_tools,
        }

        assert active_agents == expected_active_agents

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
    "offset, limit, expected_active_connections",
    [(0, 0, 0)],
    ids=["valid offset and valid limit with no active agents"],
)
async def test_active_agents_with_valid_offset_and_limit_and_no_active_agents(
    offset, limit, expected_active_connections, user_jwt_token: str
):
    await asyncio.sleep(3)

    params = {"offset": offset, "limit": limit, "agent_type": "all"}
    active_agents = await http_client.get(
        path=ENDPOINT,
        params=params,
        headers={"Authorization": f"Bearer {user_jwt_token}"},
    )

    expected_active_agents = {
        "count_active_connections": expected_active_connections,
        "active_connections": [],
    }

    assert active_agents == expected_active_agents


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "expected_active_connections",
    [3],
    ids=["default offset and limit with active agent"],
)
async def test_active_agents_with_default_offset_and_limit_with_active_agent(
    expected_active_connections,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    active_genai_agent_response_factory: Callable[[str, str, str, str, str, str], dict],
    registered_mcp_tools: list[AgentDTOPayload],
    active_agent_factory: Callable[
        [str, str, AgentType, str, dict, bool, datetime, datetime], AgentDTOPayload
    ],
    registered_a2a_card: dict,
    a2a_server_url: str,
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

        params = {"agent_type": "all"}
        active_agents = await http_client.get(
            path=ENDPOINT,
            headers={"Authorization": f"Bearer {user_jwt_token}"},
            params=params,
        )
        active_connections = [
            active_genai_agent_response_factory(
                dummy_agent.alias,
                dummy_agent.name,
                dummy_agent.description,
                dummy_agent.id,
                dummy_agent.jwt,
                dummy_agent.created_at,
                active_agents["active_connections"][0]["updated_at"],
            ),
        ]
        active_connections.append(
            await active_agent_factory(
                registered_a2a_card["id"],
                registered_a2a_card["alias"],
                AgentType.a2a,
                a2a_server_url,
                registered_a2a_card["agent_schema"],
                registered_a2a_card["is_active"],
                registered_a2a_card["created_at"],
                registered_a2a_card["updated_at"],
            ),
        )
        active_connections.extend(registered_mcp_tools)

        expected_active_agents = {
            "count_active_connections": expected_active_connections,
            "active_connections": active_connections,
        }

        assert active_agents == expected_active_agents

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
async def test_active_agents_with_invalid_params_offset(
    offset,
    limit,
    param,
    error_msg,
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

        params = {"offset": offset, "limit": limit, "agent_type": "all"}
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


# @pytest.mark.asyncio
# @pytest.mark.parametrize(
#     "offset, limit, param, error_msg",
#     [
#         (
#             1,
#             0.1,
#             "limit",
#             "Input should be a valid integer, unable to parse string as an integer",
#         ),
#         (
#             1,
#             "one",
#             "limit",
#             "Input should be a valid integer, unable to parse string as an integer",
#         ),
#         (
#             1,
#             "",
#             "limit",
#             "Input should be a valid integer, unable to parse string as an integer",
#         ),
#     ],
#     ids=[
#         "float limit",
#         "string limit",
#         "empty string limit",
#     ],
# )
# async def test_active_agents_with_invalid_params_limit(
#     offset,
#     limit,
#     param,
#     error_msg,
#     user_jwt_token: str,
#     agent_jwt_factory: Callable[[str], Awaitable[str]],
#     agent_factory: Callable[[], DummyAgent],
# ):
#     dummy_agent = agent_factory()

#     JWT_TOKEN = await agent_jwt_factory(user_jwt_token)

#     session = GenAISession(jwt_token=JWT_TOKEN)

#     @session.bind(name=dummy_agent.name, description=dummy_agent.description)
#     async def example_agent(agent_context=""):
#         return True

#     async def process_events():
#         """Processes events for the GenAISession."""
#         # logging.info(f"Agent with ID {JWT_TOKEN} started")
#         await session.process_events()

#     try:
#         event_task = asyncio.create_task(process_events())

#         await asyncio.sleep(0.1)

#         params = {"offset": offset, "limit": limit}
#         respounse = await http_client.get(
#             ENDPOINT,
#             params=params,
#             expected_status_codes=[422],
#             headers={"Authorization": f"Bearer {user_jwt_token}"},
#         )

#         expected_respounse = {
#             "detail": [
#                 {
#                     "type": "int_parsing",
#                     "loc": ["query", f"{param}"],
#                     "msg": f"{error_msg}",
#                     "input": f"{limit}",
#                 }
#             ]
#         }

#         assert respounse == expected_respounse

#     finally:
#         event_task.cancel()

#         try:
#             await event_task

#         except asyncio.CancelledError:
#             logging.info("Background task has been properly cancelled.")
