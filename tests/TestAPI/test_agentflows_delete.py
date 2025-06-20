import asyncio
import logging
import uuid
from typing import Awaitable, Callable

import pytest
from genai_session.session import GenAISession

from tests.http_client.AsyncHTTPClient import AsyncHTTPClient
from tests.schemas import AgentDTOWithJWT

AGENTFLOWS_REGISTER_FLOW = "/api/agentflows/register"
AGENTFLOWS = "/api/agentflows/"
AGENTFLOW_ID = "/api/agentflows/{agentflow_id}"

http_client = AsyncHTTPClient(timeout=10)


@pytest.mark.asyncio
async def test_agentflows_delete(
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    crud_flow_output_factory: Callable[[str, str, list, bool], dict],
):
    AIRFLOW_NAME = "Airflow Name"
    AIRFLOW_DESCRIPTION = "Airflow Description"

    dummy_agent_1 = await agent_factory(user_jwt_token)
    dummy_agent_2 = await agent_factory(user_jwt_token)

    JWT_TOKEN_1 = dummy_agent_1.jwt
    JWT_TOKEN_2 = dummy_agent_2.jwt

    session_1 = GenAISession(jwt_token=JWT_TOKEN_1)
    session_2 = GenAISession(jwt_token=JWT_TOKEN_2)

    @session_1.bind(name=dummy_agent_1.name, description=dummy_agent_1.description)
    async def example_agent_1(agent_context=""):
        return True

    @session_2.bind(name=dummy_agent_2.name, description=dummy_agent_2.description)
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

        json_data = {
            "name": AIRFLOW_NAME,
            "description": AIRFLOW_DESCRIPTION,
            "flow": [
                {"id": session_1.agent_id, "type": "genai"},
                {"id": session_2.agent_id, "type": "genai"},
            ],
        }

        await http_client.post(
            path=AGENTFLOWS_REGISTER_FLOW,
            json=json_data,
            expected_status_codes=[200],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        agentflows = await http_client.get(
            path=AGENTFLOWS,
            expected_status_codes=[200],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )
        flow = [
            {"id": session_1.agent_id, "type": "genai"},
            {"id": session_2.agent_id, "type": "genai"},
        ]
        expected_agentflows = [
            crud_flow_output_factory(AIRFLOW_NAME, AIRFLOW_DESCRIPTION, flow, True)
        ]

        assert len(agentflows) == 1

        [agentflow] = agentflows

        created_at = agentflow.pop("created_at")
        updated_at = agentflow.pop("updated_at")

        agentflow_id = agentflow.pop("id")

        assert agentflow_id

        assert updated_at
        assert created_at

        assert agentflows == expected_agentflows

        await http_client.delete(
            path=AGENTFLOW_ID.format(agentflow_id=agentflow_id),
            expected_status_codes=[204],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        agentflows = await http_client.get(
            path=AGENTFLOWS,
            expected_status_codes=[200],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        assert agentflows == []

    finally:
        for task in event_tasks:
            task.cancel()

            try:
                await task

            except asyncio.CancelledError:
                logging.info("Background task has been properly cancelled.")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "invalid_agentflow_id, expected_status_code",
    [(str(uuid.uuid4())[:-1], 422), (None, 422), ("", 405)],
    ids=[
        "delete agenflow invalid id",
        "delete agenflow None as id",
        "delete agenflow '' as id",
    ],
)
async def test_agentflows_delete_with_invalid_flow_id(
    invalid_agentflow_id,
    expected_status_code,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    crud_flow_output_factory: Callable[[str, str, list, bool], dict],
):
    AIRFLOW_NAME = "Airflow Name"
    AIRFLOW_DESCRIPTION = "Airflow Description"

    dummy_agent_1 = await agent_factory(user_jwt_token)
    dummy_agent_2 = await agent_factory(user_jwt_token)

    JWT_TOKEN_1 = dummy_agent_1.jwt
    JWT_TOKEN_2 = dummy_agent_2.jwt

    session_1 = GenAISession(jwt_token=JWT_TOKEN_1)
    session_2 = GenAISession(jwt_token=JWT_TOKEN_2)

    @session_1.bind(name=dummy_agent_1.name, description=dummy_agent_1.description)
    async def example_agent_1(agent_context=""):
        return True

    @session_2.bind(name=dummy_agent_2.name, description=dummy_agent_2.description)
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

        json_data = {
            "name": AIRFLOW_NAME,
            "description": AIRFLOW_DESCRIPTION,
            "flow": [
                {"id": session_1.agent_id, "type": "genai"},
                {"id": session_2.agent_id, "type": "genai"},
            ],
        }

        await http_client.post(
            path=AGENTFLOWS_REGISTER_FLOW,
            json=json_data,
            expected_status_codes=[200],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        agentflows = await http_client.get(
            path=AGENTFLOWS,
            expected_status_codes=[200],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )
        flow = [
            {"id": session_1.agent_id, "type": "genai"},
            {"id": session_2.agent_id, "type": "genai"},
        ]
        expected_agentflows = [
            crud_flow_output_factory(AIRFLOW_NAME, AIRFLOW_DESCRIPTION, flow, True)
        ]

        assert len(agentflows) == 1

        [agentflow] = agentflows

        created_at = agentflow.pop("created_at")
        updated_at = agentflow.pop("updated_at")

        agentflow_id = agentflow.pop("id")

        assert agentflow_id

        assert updated_at
        assert created_at

        assert agentflows == expected_agentflows

        await http_client.delete(
            path=AGENTFLOW_ID.format(agentflow_id=invalid_agentflow_id),
            expected_status_codes=[expected_status_code],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        agentflows = await http_client.get(
            path=AGENTFLOWS,
            expected_status_codes=[200],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        assert len(agentflows) == 1

    finally:
        for task in event_tasks:
            task.cancel()

            try:
                await task

            except asyncio.CancelledError:
                logging.info("Background task has been properly cancelled.")


@pytest.mark.asyncio
async def test_agentflows_delete_already_deleted_agentflow(
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    crud_flow_output_factory: Callable[[str, str, str, bool], dict],
):
    AIRFLOW_NAME = "Airflow Name"
    AIRFLOW_DESCRIPTION = "Airflow Description"

    dummy_agent_1 = await agent_factory(user_jwt_token)
    dummy_agent_2 = await agent_factory(user_jwt_token)

    JWT_TOKEN_1 = dummy_agent_1.jwt
    JWT_TOKEN_2 = dummy_agent_2.jwt

    session_1 = GenAISession(jwt_token=JWT_TOKEN_1)
    session_2 = GenAISession(jwt_token=JWT_TOKEN_2)

    @session_1.bind(name=dummy_agent_1.name, description=dummy_agent_1.description)
    async def example_agent_1(agent_context=""):
        return True

    @session_2.bind(name=dummy_agent_2.name, description=dummy_agent_2.description)
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

        json_data = {
            "name": AIRFLOW_NAME,
            "description": AIRFLOW_DESCRIPTION,
            "flow": [
                {"id": session_1.agent_id, "type": "genai"},
                {"id": session_2.agent_id, "type": "genai"},
            ],
        }

        await http_client.post(
            path=AGENTFLOWS_REGISTER_FLOW,
            json=json_data,
            expected_status_codes=[200],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        agentflows = await http_client.get(
            path=AGENTFLOWS,
            expected_status_codes=[200],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        flow = [
            {"id": session_1.agent_id, "type": "genai"},
            {"id": session_2.agent_id, "type": "genai"},
        ]
        expected_agentflows = [
            crud_flow_output_factory(AIRFLOW_NAME, AIRFLOW_DESCRIPTION, flow, True)
        ]

        assert len(agentflows) == 1

        [agentflow] = agentflows

        created_at = agentflow.pop("created_at")
        updated_at = agentflow.pop("updated_at")

        agentflow_id = agentflow.pop("id")

        assert agentflow_id

        assert updated_at
        assert created_at

        assert agentflows == expected_agentflows

        await http_client.delete(
            path=AGENTFLOW_ID.format(agentflow_id=agentflow_id),
            expected_status_codes=[204],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        agentflows = await http_client.get(
            path=AGENTFLOWS,
            expected_status_codes=[200],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        assert agentflows == []

        await http_client.delete(
            path=AGENTFLOW_ID.format(agentflow_id=agentflow_id),
            expected_status_codes=[400],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

    finally:
        for task in event_tasks:
            task.cancel()

            try:
                await task

            except asyncio.CancelledError:
                logging.info("Background task has been properly cancelled.")
