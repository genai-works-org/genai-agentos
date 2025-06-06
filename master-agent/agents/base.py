import json
from abc import ABC, abstractmethod
from typing import Any

from langchain.chat_models.base import BaseChatModel
from langchain_core.messages import ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.constants import END, START
from langgraph.graph.state import CompiledStateGraph, StateGraph
from loguru import logger

from models.states import MasterAgentState
from utils.common import filter_and_order_by_ids, remove_last_underscore_segment


class BaseMasterAgent(ABC):
    def __init__(self, model: BaseChatModel, agents: list[dict[str, Any]]) -> None:
        self.model = model
        self.agents = agents
        self._agents_to_bind_to_llm = [item["agent_schema"] for item in agents]

    @abstractmethod
    def select_agent(self, state: MasterAgentState):
        return NotImplemented

    def should_continue(self, state: MasterAgentState):
        """
        Continues the flow if any agent/flow has been selected, ends the flow otherwise.
        """
        last_message = state.messages[-1]
        if hasattr(last_message, "tool_calls"):
            if last_message.tool_calls:
                return "execute_agent"
        return END

    async def execute_agent(self, state: MasterAgentState, config: RunnableConfig):
        """
        Calls remote agent selected by Supervisor using AIConnector library.
        """
        from connectors.entities import AgentTypeEnum, GenAIConfig, GenAIFlowConfig, MCPConfig, A2AConfig
        from connectors.factory import ConnectorFactory

        messages = state.messages
        agent_call = messages[-1].tool_calls[0]
        agent_name = agent_call["name"]

        agent_to_execute = [agent for agent in self.agents if agent["name"] == agent_name][0]
        agent_type = agent_to_execute["type"]

        try:
            if agent_type == AgentTypeEnum.gen_ai.value:
                agent_config = GenAIConfig(
                    id=agent_to_execute.get("id"),
                    name=remove_last_underscore_segment(agent_name),
                    arguments=agent_call["args"],
                    session=config.get("configurable", {}).get("session")
                )
            elif agent_type == AgentTypeEnum.flow.value:
                agent_config = GenAIFlowConfig(
                    id=agent_to_execute.get("id"),
                    name=remove_last_underscore_segment(agent_name),
                    agents=filter_and_order_by_ids(
                        ids=agent_to_execute.get("flow", []),
                        items=self.agents
                    ),
                    model=self.model,
                    messages=messages[:-1].copy(),  # exclude last AI message
                    session=config.get("configurable", {}).get("session")
                )
            elif agent_type == AgentTypeEnum.mcp.value:
                agent_config = MCPConfig(
                    id=agent_to_execute.get("id"),
                    name=remove_last_underscore_segment(agent_name),
                    endpoint=f"{agent_to_execute.get("url")}/mcp",
                    arguments=agent_call["args"]
                )
            elif agent_type == AgentTypeEnum.a2a.value:
                agent_config = A2AConfig(
                    id=agent_to_execute.get("id"),
                    name=remove_last_underscore_segment(agent_name),
                    endpoint=agent_to_execute.get("url"),
                    task=agent_call["args"]["task"],
                    text=agent_call["args"]["text"]
                )
            else:
                raise ValueError("Unknown agent type")

            connector = ConnectorFactory.get_connector(agent_config)

            logger.info(f"Invoking {agent_name} ({agent_type}) with parameters: {agent_call["args"]}")
            response, trace = await connector.invoke()
            logger.success(f"Agent {agent_name} response: {response}")

            agent_call_message = ToolMessage(
                content=json.dumps(response),
                name=agent_to_execute.get("name"),
                tool_call_id=agent_call["id"],
            )
            return {"messages": [agent_call_message], "trace": [trace]}

        except Exception as e:
            error_message = f"Unexpected error while invoking {agent_name}: {e}"
            logger.exception(error_message, exc_info=e)

            trace = {
                "name": "MasterAgent",
                "input": messages[-1].model_dump(),
                "output": error_message,
                "is_success": False
            }
            return {
                "messages": ToolMessage(
                    content=error_message,
                    name=agent_to_execute.get("name")
                ),
                "trace": [trace]
            }

    @property
    def graph(self) -> CompiledStateGraph:
        """
        Execution graph of Master Agent.
        """
        workflow = StateGraph(MasterAgentState)

        workflow.add_node("supervisor", self.select_agent)
        workflow.add_node("execute_agent", self.execute_agent)

        workflow.add_edge(START, "supervisor")
        workflow.add_conditional_edges("supervisor", self.should_continue, ["execute_agent", END])
        workflow.add_edge("execute_agent", "supervisor")

        compiled_graph = workflow.compile()
        return compiled_graph
