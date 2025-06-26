import asyncio
import logging
import uuid
from typing import Awaitable, Callable

import pytest
from genai_session.session import GenAISession

from tests.conftest import http_client as HTTP
from tests.http_client.AsyncHTTPClient import AsyncHTTPClient
from tests.schemas import AgentDTOWithJWT, AgentType

AGENTFLOWS_REGISTER_FLOW = "/api/agentflows/register"
AGENTFLOWS = "/api/agentflows/"
AGENTFLOW_ID = "/api/agentflows/{agentflow_id}"

http_client = AsyncHTTPClient(timeout=10)


@pytest.mark.asyncio
async def test_agentflows_register_agentflows_with_two_valid_agents(
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    flow_response_factory: Callable[[str, AgentType, str, list[dict], bool], dict],
    crud_flow_output_factory: Callable[[str, AgentType, str, list[dict], bool], dict],
    flow_dto_factory: Callable[[str, AgentType, str, list[dict], bool], dict],
):
    AGENTFLOW_NAME = "Airflow Name"
    AGENTFLOW_DESCRIPTION = "Airflow Description"

    dummy_agent_1 = await agent_factory(user_jwt_token)
    dummy_agent_2 = await agent_factory(user_jwt_token)

    AUTH_JWT_1 = dummy_agent_1.jwt
    AUTH_JWT_2 = dummy_agent_2.jwt

    session_1 = GenAISession(jwt_token=AUTH_JWT_1)
    session_2 = GenAISession(jwt_token=AUTH_JWT_2)

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
            "name": AGENTFLOW_NAME,
            "description": AGENTFLOW_DESCRIPTION,
            "flow": [
                {"id": session_1.agent_id, "type": "genai"},
                {"id": session_2.agent_id, "type": "genai"},
            ],
        }

        response = await HTTP.post(
            path=AGENTFLOWS_REGISTER_FLOW,
            json=json_data,
            # expected_status_codes=[200],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        flow_description: str = response["description"]
        flow_name: str = response["name"]
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
            crud_flow_output_factory(flow_name, flow_description, flow, True)
        ]

        assert len(agentflows) == 1

        [agentflow] = agentflows

        created_at = agentflow.pop("created_at")
        updated_at = agentflow.pop("updated_at")

        agentflow_id = agentflow.pop("id")

        assert agentflow_id

        assert created_at == updated_at
        assert updated_at
        assert created_at

        assert agentflows == expected_agentflows

        agentflows = await http_client.get(
            path=AGENTFLOW_ID.format(agentflow_id=agentflow_id),
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        created_at = agentflows.get("created_at")
        updated_at = agentflows.get("updated_at")

        flow = [
            {"id": session_1.agent_id, "type": "genai"},
            {"id": session_2.agent_id, "type": "genai"},
        ]
        expected_agentflow = flow_response_factory(
            agentflow_id,
            AGENTFLOW_NAME,
            AGENTFLOW_DESCRIPTION,
            flow,
            True,
            created_at,
            updated_at,
        )

        assert created_at == updated_at
        assert created_at
        assert updated_at

        assert agentflows == expected_agentflow

    finally:
        for task in event_tasks:
            task.cancel()

            try:
                await task

            except asyncio.CancelledError:
                logging.info("Background task has been properly cancelled.")


@pytest.mark.asyncio
async def test_agentflows_register_agentflows_with_single_agent(
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
):
    AGENTFLOW_NAME = "Airflow Name"
    AGENTFLOW_DESCRIPTION = "Airflow Description"

    dummy_agent = await agent_factory(user_jwt_token)
    AUTH_JWT = dummy_agent.jwt
    session_1 = GenAISession(jwt_token=AUTH_JWT)

    @session_1.bind(name=dummy_agent.name, description=dummy_agent.description)
    async def example_agent_1(agent_context=""):
        return True

    async def process_event_1():
        """Processes events for the GenAISession."""
        # logging.info(f"Agents with ID {AUTH_JWT_1} started")
        await asyncio.gather(session_1.process_events())

    try:
        event_task_1 = asyncio.create_task(process_event_1())

        await asyncio.sleep(0.1)

        event_tasks = [event_task_1]

        json_data = {
            "agent_name": AGENTFLOW_NAME,
            "agent_description": AGENTFLOW_DESCRIPTION,
            "flow": [{"agent_id": session_1.agent_id}],
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
@pytest.mark.parametrize(
    "json_data",
    [
        (
            {
                "name": "",
                "description": "Airflow Description",
                "flow": [],
            }
        ),
        (
            {
                "name": "Agenflow Name",
                "description": "",
                "flow": [],
            }
        ),
    ],
    ids=[
        "register flow with empty name",
        "register flow with empty description",
    ],
)
async def test_agentflows_register_agentflow_with_empty_name_or_description(
    json_data,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
):
    dummy_agent_1 = await agent_factory(user_jwt_token)
    dummy_agent_2 = await agent_factory(user_jwt_token)

    AUTH_JWT_1 = dummy_agent_1.jwt
    AUTH_JWT_2 = dummy_agent_2.jwt

    session_1 = GenAISession(jwt_token=AUTH_JWT_1)
    session_2 = GenAISession(jwt_token=AUTH_JWT_2)

    json_data["flow"] = [
        {"id": session_1.agent_id, "type": "genai"},
        {"id": session_2.agent_id, "type": "genai"},
    ]

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

        await http_client.post(
            path=AGENTFLOWS_REGISTER_FLOW,
            json=json_data,
            expected_status_codes=[400],
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
@pytest.mark.parametrize(
    "json_data",
    [
        (
            {
                "agent_name": None,
                "agent_description": "Airflow Description",
                "flow": [],
            }
        ),
        (
            {
                "agent_name": "Agenflow Name",
                "agent_description": None,
                "flow": [],
            }
        ),
    ],
    ids=[
        "register flow with None name",
        "register flow with None description",
    ],
)
async def test_agentflows_register_agentflow_with_none_name_or_description(
    json_data,
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
):
    dummy_agent_1 = await agent_factory(user_jwt_token)
    dummy_agent_2 = await agent_factory(user_jwt_token)

    AUTH_JWT_1 = dummy_agent_1.jwt
    AUTH_JWT_2 = dummy_agent_2.jwt

    session_1 = GenAISession(jwt_token=AUTH_JWT_1)
    session_2 = GenAISession(jwt_token=AUTH_JWT_2)

    json_data["flow"] = [
        {"id": session_1.agent_id, "type": "genai"},
        {"id": session_2.agent_id, "type": "genai"},
    ]

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

        await http_client.post(
            path=AGENTFLOWS_REGISTER_FLOW,
            json=json_data,
            expected_status_codes=[422],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

    finally:
        for task in event_tasks:
            task.cancel()

            try:
                await task

            except asyncio.CancelledError:
                logging.info("Background task has been properly cancelled.")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "json_data",
    [
        (
            {
                "name": "Agenflow Name",
                "description": "Agentflow Description",
                "flow": [],
            }
        ),
        (
            {
                "name": "Agenflow Name",
                "description": "Agentflow Description",
                "flow": [
                    {"agent_id": str(uuid.uuid4())[:-1]},
                    {"agent_id": str(uuid.uuid4())[:-1]},
                ],
            }
        ),
    ],
    ids=[
        "register flow without agents",
        "register flow with invalid agents UUID",
    ],
)
async def test_agentflows_register_agentflow_with_invalid_agents_ids(
    json_data, user_jwt_token: str
):
    await http_client.post(
        path=AGENTFLOWS_REGISTER_FLOW,
        json=json_data,
        expected_status_codes=[422, 400],
        headers={"Authorization": f"Bearer {user_jwt_token}"},
    )


@pytest.mark.asyncio
async def test_agentflows_register_agentflows_with_the_same_agent(
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    crud_flow_output_factory: Callable[[str, str, list[dict], bool], dict],
    flow_response_factory: Callable[[str, AgentType, str, list[dict], bool], dict],
):
    AGENTFLOW_NAME = "Airflow Name"
    AGENTFLOW_DESCRIPTION = "Airflow Description"

    dummy_agent = await agent_factory(user_jwt_token)

    JWT_TOKEN = dummy_agent.jwt

    session_1 = GenAISession(jwt_token=JWT_TOKEN)

    @session_1.bind(name=dummy_agent.name, description=dummy_agent.description)
    async def example_agent_1(agent_context=""):
        return True

    async def process_event_1():
        """Processes events for the GenAISession."""
        # logging.info(f"Agents with ID {AUTH_JWT_1} started")
        await asyncio.gather(session_1.process_events())

    try:
        event_task_1 = asyncio.create_task(process_event_1())

        await asyncio.sleep(0.1)

        event_tasks = [event_task_1]

        json_data = {
            "name": AGENTFLOW_NAME,
            "description": AGENTFLOW_DESCRIPTION,
            "flow": [
                {"id": session_1.agent_id, "type": "genai"},
                {"id": session_1.agent_id, "type": "genai"},
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
            {"id": session_1.agent_id, "type": "genai"},
        ]
        expected_agentflows = [
            crud_flow_output_factory(AGENTFLOW_NAME, AGENTFLOW_DESCRIPTION, flow, True)
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

        agentflows = await http_client.get(
            path=AGENTFLOW_ID.format(agentflow_id=agentflow_id),
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )
        flow = [
            {"id": session_1.agent_id, "type": "genai"},
            {"id": session_1.agent_id, "type": "genai"},
        ]
        created_at = agentflows.get("created_at")
        updated_at = agentflows.get("updated_at")
        expected_agentflow = flow_response_factory(
            agentflow_id,
            AGENTFLOW_NAME,
            AGENTFLOW_DESCRIPTION,
            flow,
            True,
            created_at,
            updated_at,
        )

        assert created_at
        assert updated_at

        assert agentflows == expected_agentflow

    finally:
        for task in event_tasks:
            task.cancel()

            try:
                await task

            except asyncio.CancelledError:
                logging.info("Background task has been properly cancelled.")


@pytest.mark.asyncio
async def test_agentflows_register_agentflow_with_none_as_agents_ids(
    user_jwt_token: str,
):
    json_data = {
        "agent_name": "Agenflow Name",
        "agent_description": "Agentflow Description",
        "flow": [
            {"agent_id": None},
            {"agent_id": None},
        ],
    }

    await http_client.post(
        path=AGENTFLOWS_REGISTER_FLOW,
        json=json_data,
        expected_status_codes=[422],
        headers={"Authorization": f"Bearer {user_jwt_token}"},
    )


@pytest.mark.asyncio
async def test_agentflows_register_agentflows_with_same_valid_agents(
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    crud_flow_output_factory: Callable[[str, str, list[dict], bool], dict],
    flow_response_factory: Callable[[str, AgentType, str, list[dict], bool], dict],
):
    AGENTFLOW_NAME = "Airflow Name"
    AGENTFLOW_DESCRIPTION = "Airflow Description"

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
        flow = [
            {"id": session_1.agent_id, "type": "genai"},
            {"id": session_2.agent_id, "type": "genai"},
        ]
        json_data = {
            "name": AGENTFLOW_NAME,
            "description": AGENTFLOW_DESCRIPTION,
            "flow": flow,
        }

        await http_client.post(
            path=AGENTFLOWS_REGISTER_FLOW,
            json=json_data,
            expected_status_codes=[200],
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        await asyncio.sleep(0.1)

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

        expected_agentflows = [
            crud_flow_output_factory(AGENTFLOW_NAME, AGENTFLOW_DESCRIPTION, flow, True),
            crud_flow_output_factory(AGENTFLOW_NAME, AGENTFLOW_DESCRIPTION, flow, True),
        ]

        assert len(agentflows) == 2

        agentflow_1, agentflow_2 = agentflows

        created_at = agentflow_1.pop("created_at")
        updated_at = agentflow_1.pop("updated_at")

        agentflow_id_1 = agentflow_1.pop("id")

        assert agentflow_id_1

        assert updated_at
        assert created_at

        created_at = agentflow_2.pop("created_at")
        updated_at = agentflow_2.pop("updated_at")

        agentflow_id_2 = agentflow_2.pop("id")

        assert agentflow_id_2

        assert updated_at
        assert created_at

        assert agentflows == expected_agentflows

        agentflows = await http_client.get(
            path=AGENTFLOW_ID.format(agentflow_id=agentflow_id_1),
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        created_at = agentflows.get("created_at")
        updated_at = agentflows.get("updated_at")
        expected_agentflow = flow_response_factory(
            agentflow_id_1,
            AGENTFLOW_NAME,
            AGENTFLOW_DESCRIPTION,
            flow,
            True,
            created_at,
            updated_at,
        )

        assert created_at
        assert updated_at

        assert agentflows == expected_agentflow

        agentflows = await http_client.get(
            path=AGENTFLOW_ID.format(agentflow_id=agentflow_id_2),
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        created_at = agentflows.get("created_at")
        updated_at = agentflows.get("updated_at")
        expected_agentflow = flow_response_factory(
            agentflow_id_2,
            AGENTFLOW_NAME,
            AGENTFLOW_DESCRIPTION,
            flow,
            True,
            created_at,
            updated_at,
        )

        assert created_at
        assert updated_at

        assert agentflows == expected_agentflow

    finally:
        for task in event_tasks:
            task.cancel()

            try:
                await task

            except asyncio.CancelledError:
                logging.info("Background task has been properly cancelled.")


@pytest.mark.asyncio
async def test_agentflows_register_agentflows_with_another_agentflow_id_as_agent_id(
    user_jwt_token: str,
    agent_factory: Callable[[str], Awaitable[AgentDTOWithJWT]],
    crud_flow_output_factory: Callable[[str, str, list[dict], bool], dict],
    flow_response_factory: Callable[[str, AgentType, str, list[dict], bool], dict],
):
    AGENTFLOW_NAME = "Airflow Name"
    AGENTFLOW_DESCRIPTION = "Airflow Description"

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

        flow = [
            {"id": session_1.agent_id, "type": "genai"},
            {"id": session_2.agent_id, "type": "genai"},
        ]
        json_data = {
            "name": AGENTFLOW_NAME,
            "description": AGENTFLOW_DESCRIPTION,
            "flow": flow,
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

        expected_agentflows = [
            crud_flow_output_factory(AGENTFLOW_NAME, AGENTFLOW_DESCRIPTION, flow, True)
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

        agentflows = await http_client.get(
            path=AGENTFLOW_ID.format(agentflow_id=agentflow_id),
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )

        created_at = agentflows.get("created_at")
        updated_at = agentflows.get("updated_at")
        expected_agentflow = flow_response_factory(
            agentflow_id,
            AGENTFLOW_NAME,
            AGENTFLOW_DESCRIPTION,
            flow,
            True,
            created_at,
            updated_at,
        )

        assert created_at
        assert updated_at

        assert agentflows == expected_agentflow

        json_data = {
            "name": AGENTFLOW_NAME,
            "description": AGENTFLOW_DESCRIPTION,
            "flow": [{"agent_id": agentflow_id}, {"agent_id": agentflow_id}],
        }

        await http_client.post(
            path=AGENTFLOWS_REGISTER_FLOW,
            json=json_data,
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
