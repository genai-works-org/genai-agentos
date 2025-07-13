from typing import Any, cast

from a2a.client import A2AClient
from a2a.types import MessageSendParams, SendMessageRequest, SendMessageSuccessResponse
from genai_session.session import GenAISession
from httpx import AsyncClient
from loguru import logger
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamablehttp_client

from connectors.entities import ConnectorStrategy, A2AConfig, GenAIConfig, MCPConfig, GenAIFlowConfig
from utils.tracing import trace_execution_time


class MCPConnector(ConnectorStrategy):
    async def invoke(self, *args, **kwargs) -> tuple[dict[str, Any] | str | None, dict[str, Any]]:
        config = cast(MCPConfig, self.config)

        trace = {
            "id": config.id,
            "name": config.name,
            "type": config.agent_type,
            "url": config.endpoint,
            "input": config.arguments,
        }
        try:
            async with streamablehttp_client(config.endpoint) as (read, write, _):
                async with ClientSession(read, write) as session:
                    await session.initialize()

                    async with trace_execution_time(trace=trace):
                        response = await session.call_tool(config.name, config.arguments)

                    trace.update(
                        {
                            "output": response.model_dump(),
                            "is_success": not response.isError,
                        }
                    )
                    if response.content:
                        return response.content[0].text, trace
                    return "Success", trace

        except Exception as e:
            error_message = f"Unexpected error while invoking MCP tool: {e}"
            logger.exception(error_message)

            trace.update(
                {
                    "output": error_message,
                    "is_success": False,
                }
            )
            return error_message, trace


class A2AConnector(ConnectorStrategy):
    async def invoke(self, *args, **kwargs) -> tuple[dict[str, Any] | str | None, dict[str, Any]]:
        config = cast(A2AConfig, self.config)

        trace = {
            "id": config.id,
            "name": config.name,
            "type": config.agent_type,
            "url": config.endpoint,
            "input": config.action,
        }
        try:
            async with AsyncClient() as httpx_client:
                client = await A2AClient.get_client_from_agent_card_url(
                    httpx_client, config.endpoint
                )
                client.url = config.endpoint

                send_message_payload: dict[str, Any] = {
                    "message": {
                        "role": config.role,
                        "messageId": config.message_id,
                        "parts": [
                            {
                                "type": "text",
                                "text": config.action
                            }
                        ],
                    },
                }
                request = SendMessageRequest(
                    params=MessageSendParams(**send_message_payload)
                )

                async with trace_execution_time(trace=trace):
                    response = await client.send_message(request, http_kwargs={"timeout": None})

                if isinstance(response.root, SendMessageSuccessResponse):
                    response_text = response.root.result.artifacts[0].parts[0].root.text
                else:
                    response_text = response.root.error.message

                trace.update(
                    {
                        "output": response.model_dump(mode="json"),
                        "is_success": isinstance(response.root, SendMessageSuccessResponse)
                    }
                )

                return response_text, trace

        except Exception as e:
            error_message = f"Unexpected error while invoking A2A agent: {e}"

            logger.exception(error_message)

            trace.update(
                {
                    "output": error_message,
                    "is_success": False,
                }
            )
            return error_message, trace


class GenAIConnector(ConnectorStrategy):
    async def invoke(self, *args, **kwargs) -> tuple[dict[str, Any] | str | None, dict[str, Any]]:
        config = cast(GenAIConfig, self.config)

        trace = {
            "id": config.id,
            "name": config.name,
            "type": config.agent_type,
            "input": config.arguments
        }
        try:
            session: GenAISession = config.session
            response = await session.send(
                client_id=config.id,
                message=config.arguments
            )

            trace.update(
                {
                    "output": response.response,
                    "execution_time": response.execution_time,
                    "is_success": response.is_success
                }
            )
            return response.response, trace

        except Exception as e:
            error_message = f"Unexpected error while invoking GenAI agent: {e}"

            logger.exception(error_message)

            trace.update(
                {
                    "output": error_message,
                    "is_success": False,
                }
            )
            return error_message, trace


class GenAIFlowConnector(ConnectorStrategy):
    async def invoke(self, *args, **kwargs) -> tuple[dict[str, Any] | str | None, dict[str, Any]]:
        config = cast(GenAIFlowConfig, self.config)
        session: GenAISession = config.session

        trace = {
            "id": config.id,
            "name": config.name,
            "type": config.agent_type
        }

        async with trace_execution_time(trace=trace):
            final_state = await config.flow_master_agent.graph.ainvoke(
                input={"messages": config.messages.copy()},
                config={"configurable": {"session": session}}
            )

        response = final_state["messages"][-1].content
        trace["flow"] = final_state["trace"]
        return response, trace
