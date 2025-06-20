import asyncio
import logging
import uuid
from datetime import datetime
from typing import Awaitable, Callable

import pytest
from genai_session.session import GenAISession

from tests.http_client.AsyncHTTPClient import AsyncHTTPClient
from tests.schemas import AgentDTOWithJWT

AGENTFLOWS_REGISTER_FLOW = "/api/agentflows/register"
AGENTFLOWS = "/api/agentflows/"
AGENTFLOW_ID = "/api/agentflows/{agentflow_id}"

http_client = AsyncHTTPClient(timeout=10)

AIRFLOW_NAME = "Airflow Name"
AIRFLOW_DESCRIPTION = "Airflow Description"


@pytest.mark.asyncio
async def test_agentflows_patch_everything_with_valid_data(
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    crud_flow_output_factory: Callable[[str, str, list, bool], dict],
):
    AIRFLOW_NAME = "Airflow Name"
    AIRFLOW_DESCRIPTION = "Airflow Description"

    dummy_agent_1 = await agent_factory(user_jwt_token)
    dummy_agent_2 = await agent_factory(user_jwt_token)
    dummy_agent_3 = await agent_factory(user_jwt_token)

    JWT_TOKEN_1 = dummy_agent_1.jwt
    JWT_TOKEN_2 = dummy_agent_2.jwt
    JWT_TOKEN_3 = dummy_agent_3.jwt

    session_1 = GenAISession(jwt_token=JWT_TOKEN_1)
    session_2 = GenAISession(jwt_token=JWT_TOKEN_2)
    session_3 = GenAISession(jwt_token=JWT_TOKEN_3)

    @session_1.bind(name=dummy_agent_1.name, description=dummy_agent_1.description)
    async def example_agent_1(agent_context=""):
        return True

    @session_2.bind(name=dummy_agent_2.name, description=dummy_agent_2.description)
    async def example_agent_2(agent_context=""):
        return False

    @session_3.bind(name=dummy_agent_3.name, description=dummy_agent_3.description)
    async def example_agent_3(agent_context=""):
        return False

    async def process_event_1():
        """Processes events for the GenAISession."""
        # logging.info(f"Agents with ID {AUTH_JWT_1} started")
        await asyncio.gather(session_1.process_events())

    async def process_event_2():
        """Processes events for the GenAISession."""
        # logging.info(f"Agents with ID {AUTH_JWT_2} started")
        await asyncio.gather(session_2.process_events())

    async def process_event_3():
        """Processes events for the GenAISession."""
        # logging.info(f"Agents with ID {AUTH_JWT_3} started")
        await asyncio.gather(session_3.process_events())

    try:
        event_task_1 = asyncio.create_task(process_event_1())

        await asyncio.sleep(0.1)

        event_task_2 = asyncio.create_task(process_event_2())

        await asyncio.sleep(0.1)

        event_task_3 = asyncio.create_task(process_event_3())

        await asyncio.sleep(0.1)

        event_tasks = [event_task_1, event_task_2, event_task_3]

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

        agentflow_id_before = agentflow.pop("id")

        assert agentflow_id_before

        assert updated_at
        assert created_at

        assert agentflows == expected_agentflows

        json_data = {
            "name": f"New {AIRFLOW_NAME}",
            "description": f"New {AIRFLOW_DESCRIPTION}",
            "flow": [
                {"id": session_1.agent_id, "type": "genai"},
                {"id": session_3.agent_id, "type": "genai"},
            ],
        }

        await http_client.patch(
            path=AGENTFLOW_ID.format(agentflow_id=agentflow_id_before),
            json=json_data,
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        agentflows = await http_client.get(
            path=AGENTFLOWS,
            expected_status_codes=[200],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        flow = [
            {"id": session_1.agent_id, "type": "genai"},
            {"id": session_3.agent_id, "type": "genai"},
        ]
        expected_agentflows = [
            crud_flow_output_factory(
                f"New {AIRFLOW_NAME}", f"New {AIRFLOW_DESCRIPTION}", flow, True
            )
        ]

        assert len(agentflows) == 1

        [agentflow] = agentflows

        created_at = agentflow.pop("created_at")
        updated_at = agentflow.pop("updated_at")

        agentflow_id_after = agentflow.pop("id")

        assert agentflow_id_after

        assert agentflow_id_after == agentflow_id_before

        created_at = datetime.fromisoformat(created_at)
        updated_at = datetime.fromisoformat(updated_at)

        assert updated_at > created_at
        assert updated_at
        assert created_at

        assert agentflows == expected_agentflows

    finally:
        for task in event_tasks:
            task.cancel()

            try:
                await task

            except asyncio.CancelledError:
                logging.info("Background task has been properly cancelled.")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "patch_data",
    [
        (
            {
                "name": "",
                "description": f"New {AIRFLOW_DESCRIPTION}",
                "flow": [],
            }
        ),
        (
            {
                "name": None,
                "description": f"New {AIRFLOW_DESCRIPTION}",
                "flow": [],
            }
        ),
        (
            {
                "name": f"New {AIRFLOW_NAME}",
                "description": "",
                "flow": [],
            }
        ),
        (
            {
                "name": f"New {AIRFLOW_NAME}",
                "description": None,
                "flow": [],
            }
        ),
        (
            {
                "name": f"New {AIRFLOW_NAME}",
                "description": f"New {AIRFLOW_DESCRIPTION}",
                "flow": [{}, {}],
            }
        ),
    ],
    ids=[
        "patch agentflow with invalid name (empty string)",
        "patch agentflow with invalid name (None)",
        "patch agentflow with invalid description (empty string)",
        "patch agentflow with invalid description (None)",
        "patch agentflow with invalid flow (empty)",
    ],
)
async def test_agentflows_patch_with_invalid_data(
    patch_data,
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

    empty_flow = [{}, {}]
    if patch_data["flow"] != empty_flow:
        patch_data["flow"] = [
            {"id": session_1.agent_id, "type": "genai"},
            {"id": session_2.agent_id, "type": "genai"},
        ]
    else:
        patch_data["flow"] = empty_flow

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

        await http_client.patch(
            path=AGENTFLOW_ID.format(agentflow_id=agentflow_id),
            json=patch_data,
            expected_status_codes=[400, 422],
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

        created_at = datetime.fromisoformat(created_at)
        updated_at = datetime.fromisoformat(updated_at)

        assert updated_at <= created_at
        assert updated_at
        assert created_at

        assert agentflows == expected_agentflows

    finally:
        for task in event_tasks:
            task.cancel()

            try:
                await task

            except asyncio.CancelledError:
                logging.info("Background task has been properly cancelled.")


# TODO: Shoul fail if we are trying to puch with non existing agents. SUSPICIOUS
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "patch_data",
    [
        (
            {
                "name": f"New {AIRFLOW_NAME}",
                "description": f"New {AIRFLOW_DESCRIPTION}",
                "flow": [],
            }
        ),
    ],
    ids=[
        "patch agentflow with invalid flow (non existing agents)",
    ],
)
async def test_agentflows_patch_with_non_existing_agents(
    patch_data,
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

    patch_data["flow"] = [
        {"id": str(uuid.uuid4()), "type": "genai"},
        {"id": str(uuid.uuid4()), "type": "genai"},
    ]

    @session_1.bind(name=dummy_agent_1.name, description=dummy_agent_2.description)
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

        await http_client.patch(
            path=AGENTFLOW_ID.format(agentflow_id=agentflow_id),
            json=patch_data,
            expected_status_codes=[400],
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

        created_at = datetime.fromisoformat(created_at)
        updated_at = datetime.fromisoformat(updated_at)

        assert updated_at
        assert created_at

        assert agentflows == expected_agentflows

    finally:
        for task in event_tasks:
            task.cancel()

            try:
                await task

            except asyncio.CancelledError:
                logging.info("Background task has been properly cancelled.")


@pytest.mark.asyncio
async def test_agentflows_patch_flow_single_agent_id(
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    crud_flow_output_factory: Callable[[str, str, list, bool], dict],
):
    AIRFLOW_NAME = "Airflow Name"
    AIRFLOW_DESCRIPTION = "Airflow Description"

    dummy_agent_1 = await agent_factory(user_jwt_token)
    dummy_agent_2 = await agent_factory(user_jwt_token)
    dummy_agent_3 = await agent_factory(user_jwt_token)

    JWT_TOKEN_1 = dummy_agent_1.jwt
    JWT_TOKEN_2 = dummy_agent_2.jwt
    JWT_TOKEN_3 = dummy_agent_3.jwt

    session_1 = GenAISession(jwt_token=JWT_TOKEN_1)
    session_2 = GenAISession(jwt_token=JWT_TOKEN_2)
    session_3 = GenAISession(jwt_token=JWT_TOKEN_3)

    @session_1.bind(name=dummy_agent_1.name, description=dummy_agent_1.description)
    async def example_agent_1(agent_context=""):
        return True

    @session_2.bind(name=dummy_agent_2.name, description=dummy_agent_2.description)
    async def example_agent_2(agent_context=""):
        return False

    @session_3.bind(name=dummy_agent_3.name, description=dummy_agent_3.description)
    async def example_agent_3(agent_context=""):
        return False

    async def process_event_1():
        """Processes events for the GenAISession."""
        # logging.info(f"Agents with ID {AUTH_JWT_1} started")
        await asyncio.gather(session_1.process_events())

    async def process_event_2():
        """Processes events for the GenAISession."""
        # logging.info(f"Agents with ID {AUTH_JWT_2} started")
        await asyncio.gather(session_2.process_events())

    async def process_event_3():
        """Processes events for the GenAISession."""
        # logging.info(f"Agents with ID {AUTH_JWT_3} started")
        await asyncio.gather(session_3.process_events())

    try:
        event_task_1 = asyncio.create_task(process_event_1())

        await asyncio.sleep(0.1)

        event_task_2 = asyncio.create_task(process_event_2())

        await asyncio.sleep(0.1)

        event_task_3 = asyncio.create_task(process_event_3())

        await asyncio.sleep(0.1)

        event_tasks = [event_task_1, event_task_2, event_task_3]

        json_data = {
            "name": AIRFLOW_NAME,
            "description": AIRFLOW_DESCRIPTION,
            "flow": [
                {"id": session_1.agent_id, "type": "genai"},
            ],
        }

        await http_client.post(
            path=AGENTFLOWS_REGISTER_FLOW,
            json=json_data,
            expected_status_codes=[422],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        agentflows = await http_client.get(
            path=AGENTFLOWS,
            expected_status_codes=[200],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        assert len(agentflows) == 0

    finally:
        for task in event_tasks:
            task.cancel()

            try:
                await task

            except asyncio.CancelledError:
                logging.info("Background task has been properly cancelled.")


@pytest.mark.asyncio
async def test_agentflows_patch_flow_id_as_agent_id(
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

        agentflow_id_before = agentflow.pop("id")

        assert agentflow_id_before

        assert updated_at
        assert created_at

        assert agentflows == expected_agentflows

        json_data = {
            "name": f"New {AIRFLOW_NAME}",
            "description": f"New {AIRFLOW_DESCRIPTION}",
            "flow": [
                {"id": session_1.agent_id, "type": "genai"},
                {"id": agentflow_id_before, "type": "genai"},
            ],
        }

        response = await http_client.patch(
            path=AGENTFLOW_ID.format(agentflow_id=agentflow_id_before),
            json=json_data,
            expected_status_codes=[400],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        expected_response = {
            "detail": f"One or more agents were not registered previously or are not active: ['{agentflow_id_before}']. Make sure agent was registered by you and is active before including it into the agent flow"  # noqa: E501
        }

        assert response == expected_response

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

        agentflow_id_after = agentflow.pop("id")

        assert agentflow_id_after

        assert agentflow_id_after == agentflow_id_before

        created_at = datetime.fromisoformat(created_at)
        updated_at = datetime.fromisoformat(updated_at)

        assert updated_at == created_at
        assert updated_at
        assert created_at

        assert agentflows == expected_agentflows

    finally:
        for task in event_tasks:
            task.cancel()

            try:
                await task

            except asyncio.CancelledError:
                logging.info("Background task has been properly cancelled.")


# TODO: patch agentflow that does not exist
@pytest.mark.asyncio
async def test_agentflows_patch_agentflow_that_dows_not_exist(
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

        agentflow_id_before = agentflow.pop("id")

        assert agentflow_id_before

        assert updated_at
        assert created_at

        assert agentflows == expected_agentflows

        json_data = {
            "name": f"New {AIRFLOW_NAME}",
            "description": f"New {AIRFLOW_DESCRIPTION}",
            "flow": [
                {"id": session_1.agent_id, "type": "genai"},
                {"id": session_2.agent_id, "type": "genai"},
            ],
        }

        non_existing_agentflow_id = str(uuid.uuid4())

        await http_client.patch(
            path=AGENTFLOW_ID.format(agentflow_id=non_existing_agentflow_id),
            json=json_data,
            expected_status_codes=[400],
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

        agentflow_id_after = agentflow.pop("id")

        assert agentflow_id_after

        assert agentflow_id_after == agentflow_id_before

        created_at = datetime.fromisoformat(created_at)
        updated_at = datetime.fromisoformat(updated_at)

        assert updated_at
        assert created_at

        assert agentflows == expected_agentflows

    finally:
        for task in event_tasks:
            task.cancel()

            try:
                await task

            except asyncio.CancelledError:
                logging.info("Background task has been properly cancelled.")
