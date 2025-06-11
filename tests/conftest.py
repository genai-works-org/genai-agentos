import os
import random
import string
from typing import Awaitable, Callable, Optional

import aiohttp
import jwt
import pytest_asyncio
from pydantic import BaseModel, Field

from tests.constants import SPECIAL_CHARS, TEST_FILES_FOLDER
from tests.schemas import AgentDTOWithJWT

os.environ["ROUTER_WS_URL"] = "ws://0.0.0.0:8080/ws"
os.environ["DEFAULT_FILES_FOLDER_NAME"] = TEST_FILES_FOLDER


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


def _generate_password_with_special_char(length: int):
    return (
        "".join(
            random.choices(string.ascii_uppercase + string.ascii_lowercase, k=length)
        )
        + random.choice(string.digits)
        + random.choice(SPECIAL_CHARS)
    )


def _generate_random_string(length: int):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


class DummyAgent(BaseModel):
    name: str = Field(default_factory=lambda x: _generate_random_string(8))
    description: str = Field(default_factory=lambda x: _generate_random_string(8))
    input_parameters: dict = Field({})
    alias: Optional[str] = None


@pytest_asyncio.fixture(scope="function")
async def registered_user():
    register_url = "/api/register"
    username = _generate_random_string(8).capitalize()
    creds = {"username": username, "password": _generate_password_with_special_char(8)}
    await http_client.post(path=register_url, json=creds)
    return creds


@pytest_asyncio.fixture(scope="function")
async def user_jwt_token(registered_user):
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
