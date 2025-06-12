import os
import random
import string
from datetime import datetime
from multiprocessing import Process
from typing import Awaitable, Callable, Optional

import aiohttp
import jwt
import pytest_asyncio
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from a2a_resources import ReimbursementAgent, ReimbursementAgentExecutor
from mcp.server import FastMCP
from pydantic import BaseModel, Field
from sqlalchemy import NullPool, inspect, text
from sqlalchemy.ext.asyncio import create_async_engine

from tests.constants import SPECIAL_CHARS, TEST_FILES_FOLDER
from tests.schemas import AgentDTOPayload, AgentDTOWithJWT, AgentType

os.environ["ROUTER_WS_URL"] = "ws://0.0.0.0:8080/ws"
os.environ["DEFAULT_FILES_FOLDER_NAME"] = TEST_FILES_FOLDER


# TODO:
# - add db connection, cleanup on session stop
# - clean up mcp/a2a instances
# -


class HttpClient:
    def __init__(self, base_url: str = ""):
        self.base_url = base_url.rstrip("/")

    async def _request(self, method: str, path: str, **kwargs):
        url = f"{self.base_url}/{path.lstrip('/')}"
        async with aiohttp.ClientSession() as session:
            async with session.request(method, url, **kwargs) as response:
                return await response.json()

    async def get(self, path: str, **kwargs):
        return await self._request("GET", path, **kwargs)

    async def post(self, path: str, **kwargs):
        return await self._request("POST", path, **kwargs)

    async def put(self, path: str, **kwargs):
        return await self._request("PUT", path, **kwargs)

    async def delete(self, path: str, **kwargs):
        return await self._request("DELETE", path, **kwargs)


http_client = HttpClient(base_url="http://localhost:8000")


def _construct_db_uri():
    return "postgresql+asyncpg://postgres:postgres@0.0.0.0:5432/postgres"


@pytest_asyncio.fixture(scope="session", autouse=True)
async def db_cleanup():
    db_uri = _construct_db_uri()
    assert db_uri is not None
    engine = create_async_engine(
        db_uri,
        poolclass=NullPool,
        future=True,
        pool_pre_ping=True,
    )

    # simplified db cleanup before pytest session starts
    # looking up all of the table names and running DELETE FROM vs test db
    # not running 'DROP SCHEMA public CASCADE' in order to not run migrations on test DB
    # DB cleanup is required to register MCP/A2A agents as their URLs should be unique
    async with engine.begin() as conn:
        tables: list[str] = await conn.run_sync(
            lambda sync_conn: inspect(sync_conn).get_table_names()
        )
        for t in tables:
            await conn.execute(text(f"DELETE FROM {t};"))

    return


def _generate_password_with_special_char(length: int):
    chars = [
        random.choice(string.ascii_lowercase),
        random.choice(string.ascii_uppercase),
        random.choice(string.digits),
        random.choice(SPECIAL_CHARS),
    ]

    # Fill the rest with random choices from the full pool
    all_chars = string.ascii_letters + string.digits
    chars += random.choices(all_chars, k=length - 4)

    random.shuffle(chars)
    return "".join(chars)


def _generate_random_string(length: int):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


class DummyAgent(BaseModel):
    name: str = Field(default_factory=lambda x: _generate_random_string(8))
    description: str = Field(default_factory=lambda x: _generate_random_string(8))
    input_parameters: dict = Field({})
    alias: Optional[str] = None


@pytest_asyncio.fixture(scope="session")
async def registered_user():
    register_url = "/api/register"
    username = _generate_random_string(8).capitalize()
    creds = {"username": username, "password": _generate_password_with_special_char(8)}
    await http_client.post(path=register_url, json=creds)
    return creds


@pytest_asyncio.fixture(scope="session")
async def user_jwt_token(registered_user, db_cleanup):
    """
    Logs in the session-scoped user once and provides the JWT token.
    This token is reused across all tests in the session.
    """
    login_url = "/api/login/access-token"
    form_data = aiohttp.FormData()
    form_data.add_field(name="username", value=registered_user["username"])
    form_data.add_field(name="password", value=registered_user["password"])

    response = await http_client.post(path=login_url, data=form_data)

    token = response["access_token"]
    return token


def _generate_alias(agent_name: str):
    rand_alnum_str = "".join(random.choice(string.ascii_lowercase) for _ in range(6))
    return f"{agent_name}_{rand_alnum_str}"


def dummy_agent_with_alias():
    agent = DummyAgent()
    agent.alias = _generate_alias(agent.name)
    return agent


@pytest_asyncio.fixture
async def dummy_agent_factory():
    def generate_dummy_agent():
        return dummy_agent_with_alias()

    return generate_dummy_agent


@pytest_asyncio.fixture
async def agent_factory(
    dummy_agent_factory,
) -> Callable[[str], Awaitable[AgentDTOWithJWT]]:
    async def register_new_agent(user_jwt_token: str):
        login_url = "/api/agents/register"
        dummy_agent: DummyAgent = dummy_agent_factory()
        response = await http_client.post(
            path=login_url,
            json=dummy_agent.model_dump(mode="json"),
            headers={"Authorization": f"Bearer {user_jwt_token}"},
        )
        return AgentDTOWithJWT(**response)

    return register_new_agent


@pytest_asyncio.fixture
async def get_user():
    async def decode_token(user_jwt_token: str):
        decoded = jwt.decode(
            user_jwt_token, options={"verify_signature": False}, algorithms=["HS256"]
        )
        return decoded.get("sub")

    return decode_token


@pytest_asyncio.fixture
def active_genai_agent_response_factory():
    def build_agent_body(name: str, description: str, agent_id: str, jwt_token: str):
        body = {
            "agent_id": agent_id,
            "agent_name": name,
            "agent_description": description,
            "agent_schema": {
                "type": "function",
                "function": {
                    "name": agent_id,
                    "description": description,
                    "parameters": {
                        "type": "object",
                        "properties": {},
                        "required": [],
                    },
                },
            },
            "agent_jwt": jwt_token,
            "is_active": True,
        }
        return body

    return build_agent_body


@pytest_asyncio.fixture
def genai_agent_register_response_factory():
    def build_response_body(name: str, description: str, agent_id: str, jwt_token: str):
        return {
            "agent_id": agent_id,
            "agent_name": name,
            "agent_description": description,
            "agent_schema": {},
            "agent_jwt": jwt_token,
            "is_active": False,
        }

    return build_response_body


def mcp_server():
    server = FastMCP("TestServer")

    @server.tool(name="test_tool")
    def test_tool(name: str) -> str:
        return f"Tool named {name}"

    server.settings.host = "0.0.0.0"
    server.settings.port = 8888
    server.settings.log_level = "DEBUG"
    server.run(transport="streamable-http")


@pytest_asyncio.fixture(autouse=True, scope="session")
async def run_mcp():
    proc = Process(target=mcp_server, daemon=True)
    proc.start()

    import time

    time.sleep(5)  # letting uvicorn start correctly
    yield
    proc.terminate()


@pytest_asyncio.fixture(autouse=True, scope="session")
async def registered_mcp_server(
    user_jwt_token, run_mcp
) -> Callable[[], Awaitable[dict]]:
    add_mcp_url = "/api/mcp/servers"
    server_data = await http_client.post(
        path=add_mcp_url,
        # TODO: replace before using tests in compose
        json={"server_url": "http://host.docker.internal:8888/mcp"},
        headers={"Authorization": f"Bearer {user_jwt_token}"},
    )
    return server_data


def run_a2a_server():
    skill = AgentSkill(
        id="process_reimbursement",
        name="Process Reimbursement Tool",
        description="Helps with the reimbursement process for users given the amount and purpose of the reimbursement.",  # noqa: E501
        tags=["reimbursement"],
        examples=["Can you reimburse me $20 for my lunch with the clients?"],
    )
    capabilities = AgentCapabilities(streaming=True)
    card = AgentCard(
        name="Reimbursement Agent",
        description="This agent handles the reimbursement process for the employees given the amount and purpose of the reimbursement.",  # noqa: E501
        url="http://localhost:10002/",
        version="1.0.0",
        defaultInputModes=ReimbursementAgent.SUPPORTED_CONTENT_TYPES,
        defaultOutputModes=ReimbursementAgent.SUPPORTED_CONTENT_TYPES,
        capabilities=capabilities,
        skills=[skill],
    )
    request_handler = DefaultRequestHandler(
        agent_executor=ReimbursementAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )
    server = A2AStarletteApplication(agent_card=card, http_handler=request_handler)
    import uvicorn

    uvicorn.run(server.build(), host="localhost", port=10002, loop="asyncio")


@pytest_asyncio.fixture(autouse=True, scope="session")
async def run_a2a():
    proc = Process(target=run_a2a_server, daemon=True)
    proc.start()

    import time

    time.sleep(5)
    yield
    proc.terminate()


@pytest_asyncio.fixture(autouse=True)
async def registered_a2a_card(user_jwt_token, run_a2a):
    add_mcp_url = "/api/a2a/agents"
    server_data = await http_client.post(
        path=add_mcp_url,
        json={"server_url": "http://host.docker.internal:10002"},
        headers={"Authorization": f"Bearer {user_jwt_token}"},
    )
    return server_data


@pytest_asyncio.fixture
async def active_agent_factory():
    async def build_agent_dto(
        id: str,
        name: str,
        type: AgentType,
        url: str,
        agent_schema: dict,
        is_active: bool,
        created_at: datetime,
        updated_at: datetime,
    ):
        return AgentDTOPayload(
            id=id,
            name=name,
            type=type,
            url=url,
            agent_schema=agent_schema,
            is_active=is_active,
            created_at=created_at,
            updated_at=updated_at,
        )

    return build_agent_dto
