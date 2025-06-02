import asyncio
from typing import Any, Optional

from genai_session.session import GenAISession
from genai_session.utils.context import GenAIContext
from langchain_core.messages import SystemMessage
from loguru import logger

from agents import ReActMasterAgent
from config.settings import Settings
from llms import LLMFactory
from prompts import FILE_RELATED_SYSTEM_PROMPT
from utils.agents import get_agents
from utils.chat_history import get_chat_history
from utils.common import attach_files_to_message
from utils.tracing import AgentTracer

app_settings = Settings()

session = GenAISession(
    api_key=app_settings.MASTER_AGENT_API_KEY,
    ws_url=app_settings.ROUTER_WS_URL
)


@session.bind(name="MasterAgent", description="Master agent that orchestrates other agents")
async def receive_message(
        agent_context: GenAIContext,
        session_id: str,
        user_id: str,
        configs: dict[str, Any],
        files: Optional[list[dict[str, Any]]],
        timestamp: str
):

    graph_config = {"configurable": {"session": session}}
    output = {"is_success": False}

    tracer = AgentTracer()

    base_system_prompt = configs.get("llm", {}).get("system_prompt")
    user_system_prompt = configs.get("llm", {}).get("user_prompt")

    system_prompt = user_system_prompt or base_system_prompt
    system_prompt = f"{system_prompt}\n\n{FILE_RELATED_SYSTEM_PROMPT}"

    chat_history = await get_chat_history(
        f"{app_settings.BACKEND_API_URL}/chat",
        session_id=session_id,
        user_id=user_id,
        api_key=app_settings.MASTER_BE_API_KEY,
        max_last_messages=configs.get("max_last_messages", 10)
    )

    chat_history[-1] = attach_files_to_message(message=chat_history[-1], files=files) if files else chat_history[-1]
    init_messages = [
        SystemMessage(content=system_prompt),
        *chat_history
    ]

    agents = await get_agents(
        url=f"{app_settings.BACKEND_API_URL}/agents/active",
        agent_type="all",
        api_key=app_settings.MASTER_BE_API_KEY,
        user_id=user_id
    )

    try:
        llm = LLMFactory.create(configs=configs.get("llm", {}))
        master_agent = ReActMasterAgent(model=llm, agents=agents, tracer=tracer)

        logger.info("Running Master Agent")

        final_state = await master_agent.graph.ainvoke(
            input={"messages": init_messages},
            config=graph_config
        )

        response = final_state["messages"][-1].content
        output["is_success"] = True
        logger.success("Master Agent run successfully")

    except Exception as e:
        response = f"An error occurred: {type(e).__name__} - {e}"
        logger.exception(response)

    return {"agents_trace": tracer.traces, "response": response, **output}


async def main():
    logger.info("Master Agent started")
    await session.process_events()


if __name__ == "__main__":
    asyncio.run(main())
