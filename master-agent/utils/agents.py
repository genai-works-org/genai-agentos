from typing import Any

import httpx
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage, AIMessage
from langchain_openai import ChatOpenAI

from llms.custom import ChatGenAI
from utils.common import bind_tools_safely, generate_hmac, combine_messages
from config.settings import Settings

async def get_agents(url: str, agent_type: str, api_key: str, user_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            headers={"X-API-KEY": api_key},
            params={"agent_type": agent_type, "user_id": user_id},
        )

        response.raise_for_status()
        agents = response.json()

    return agents["active_connections"]


async def select_agent_and_resolve_parameters(
        model: BaseChatModel,
        messages: list[BaseMessage],
        agents: list[dict[str, Any]],
        agent_choice: bool = False
) -> AIMessage:
    if isinstance(model, ChatGenAI):
        model_json = model.model_dump()
        model_json["default_headers"] = {
            "X-HMAC": generate_hmac(Settings().SECRET_KEY, combine_messages(messages))
        }
        model = ChatOpenAI.model_validate(model_json)

    model_with_agents = bind_tools_safely(model=model, tools=agents, tool_choice=agent_choice)

    response = await model_with_agents.ainvoke(messages)
    return response
