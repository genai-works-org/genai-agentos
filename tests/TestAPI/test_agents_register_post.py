import uuid
from typing import Awaitable, Callable

import pytest

from tests.http_client.AsyncHTTPClient import AsyncHTTPClient
from tests.schemas import AgentDTOWithJWT

AGENTS_REGISTER_ENDPOINT = "/api/agents/register"
AGENT_ENDPOINT = "/api/agents/{agent_id}"

http_client = AsyncHTTPClient(timeout=10)


@pytest.mark.asyncio
async def test_agents_register_inactive_agent(
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    genai_agent_register_response_factory: Callable[[str, str, str, str], dict],
):
    dummy_agent = await agent_factory(user_jwt_token)

    json_data = {
        "name": dummy_agent.name,
        "description": dummy_agent.description,
        "input_parameters": {},
    }

    await http_client.post(
        path=AGENTS_REGISTER_ENDPOINT,
        json=json_data,
        expected_status_codes=[200],
        headers={"Authorization": f"Bearer {user_jwt_token}"},
    )

    agent = await http_client.get(
        path=AGENT_ENDPOINT.format(agent_id=dummy_agent.id),
        headers={"Authorization": f"Bearer {user_jwt_token}"},
    )

    created_at = agent.pop("created_at")
    updated_at = agent.pop("updated_at")

    assert created_at
    assert updated_at

    expected_agent = genai_agent_register_response_factory(
        dummy_agent.alias,
        dummy_agent.name,
        dummy_agent.description,
        dummy_agent.id,
        dummy_agent.jwt,
    )

    assert agent == expected_agent


# @pytest.mark.asyncio
# async def test_agents_register_already_active_agent(
#     user_jwt_token: str,
#     agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
#     genai_agent_register_response_factory: Callable[[str, str, str, str], dict],
# ):
#     dummy_agent = await agent_factory(user_jwt_token)

#     JWT_TOKEN = dummy_agent.jwt

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

#         await asyncio.sleep(0.3)

#         json_data = {
#             "id": session.agent_id,
#             "name": dummy_agent.name,
#             "description": dummy_agent.description,
#             "input_parameters": {},
#         }

#         await http_client.post(
#             path=AGENTS_REGISTER_ENDPOINT,
#             json=json_data,
#             expected_status_codes=[400],
#             headers={"Authorization": f"Bearer {user_jwt_token}"},
#         )

#         agent = await http_client.get(
#             path=AGENT_ENDPOINT.format(agent_id=session.agent_id),
#             headers={"Authorization": f"Bearer {user_jwt_token}"},
#         )

#         created_at = agent.pop("created_at")
#         updated_at = agent.pop("updated_at")

#         assert created_at
#         assert updated_at

#         expected_agent = genai_agent_register_response_factory(
#             dummy_agent.name, dummy_agent.description, dummy_agent.id, dummy_agent.jwt
#         )

#         assert agent == expected_agent

#     finally:
#         event_task.cancel()

#         try:
#             await event_task

#         except asyncio.CancelledError:
#             logging.info("Background task has been properly cancelled.")


@pytest.mark.asyncio
async def test_agents_register_inactive_agent_with_invalid_id(
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
):
    dummy_agent = await agent_factory(user_jwt_token)

    json_data = {
        "id": str(uuid.uuid4())[:-1],
        "name": dummy_agent.name,
        "description": dummy_agent.description,
        "input_parameters": {},
    }

    await http_client.post(
        path=AGENTS_REGISTER_ENDPOINT,
        json=json_data,
        expected_status_codes=[400],
        headers={"Authorization": f"Bearer {user_jwt_token}"},
    )


@pytest.mark.asyncio
async def test_agents_register_inactive_agent_with_none_as_id(
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
):
    dummy_agent = await agent_factory(user_jwt_token)

    json_data = {
        "id": None,
        "name": dummy_agent.name,
        "description": dummy_agent.description,
        "input_parameters": {},
    }

    await http_client.post(
        path=AGENTS_REGISTER_ENDPOINT,
        json=json_data,
        expected_status_codes=[400],
        headers={"Authorization": f"Bearer {user_jwt_token}"},
    )


@pytest.mark.asyncio
async def test_agents_register_incative_agent_with_none_as_name(user_jwt_token: str):
    AGENT_DESCRIPTION = "Agent Description"

    agent_id = str(uuid.uuid4())

    json_data = {
        "id": agent_id,
        "name": None,
        "description": AGENT_DESCRIPTION,
        "input_parameters": {},
    }

    await http_client.post(
        path=AGENTS_REGISTER_ENDPOINT,
        json=json_data,
        expected_status_codes=[422],
        headers={"Authorization": f"Bearer {user_jwt_token}"},
    )


@pytest.mark.asyncio
async def test_agents_register_incative_agent_with_none_as_description(
    user_jwt_token: str,
):
    AGENT_NAME = "Agent Name"

    agent_id = str(uuid.uuid4())

    json_data = {
        "id": agent_id,
        "name": AGENT_NAME,
        "description": None,
        "input_parameters": {},
    }

    await http_client.post(
        path=AGENTS_REGISTER_ENDPOINT,
        json=json_data,
        expected_status_codes=[422],
        headers={"Authorization": f"Bearer {user_jwt_token}"},
    )


@pytest.mark.asyncio
async def test_agents_register_incative_agent_with_none_as_input_parameters(
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    genai_agent_register_response_factory: Callable[[str, str, str, str], dict],
):
    dummy_agent = await agent_factory(user_jwt_token)

    json_data = {
        "id": str(uuid.uuid4()),
        "name": dummy_agent.name,
        "description": dummy_agent.description,
        "input_parameters": None,
    }

    await http_client.post(
        path=AGENTS_REGISTER_ENDPOINT,
        json=json_data,
        expected_status_codes=[422],
        headers={"Authorization": f"Bearer {user_jwt_token}"},
    )
