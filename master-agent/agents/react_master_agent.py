from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage
from loguru import logger

from agents.base import BaseMasterAgent
from models.states import MasterAgentState
from utils.agents import select_agent_and_resolve_parameters
from utils.tracing import trace_execution_time


class ReActMasterAgent(BaseMasterAgent):
    def __init__(
            self,
            model: BaseChatModel,
            agents: list[dict[str, Any]]
    ) -> None:
        """
        Supervisor agent building on top of ReAct framework to automatically execute available agents and flows.
        ReAct framework allows to continuously call tools (remote agents in this case) to complete task assigned by user.

        Args:
            model (BaseChatModel): Langchain chat model (preferably OpenAI or Azure OpenAI)
            agents (list[dict[str, Any]]): List of available agents
        """
        super().__init__(model, agents)
        self._agents_to_bind_to_llm = [item["agent_schema"] for item in agents]

    async def select_agent(self, state: MasterAgentState):
        """
        Selects agent/flow to execute, determine input parameters for the agent/flow.
        Acts as main supervisor node.
        """
        messages = state.messages
        trace = {
            "name": "MasterAgent",
            "input": messages[-1].model_dump(),
        }
        logger.info("Selecting agent to execute")

        try:
            async with trace_execution_time(trace=trace):
                response = await select_agent_and_resolve_parameters(
                    model=self.model,
                    messages=messages,
                    agents=self._agents_to_bind_to_llm
                )

            if response.tool_calls:
                logger.success(f"Selected {response.tool_calls[0]["name"]} with args {response.tool_calls[0]["args"]}")
            else:
                logger.success(f"No agent is selected, generating final response")

            trace.update(
                {
                    "output": response.model_dump(),
                    "is_success": True
                }
            )
            return {"messages": [response], "trace": [trace]}

        except Exception as e:
            error_message = f"Unexpected error while selecting agent: {e}"
            logger.exception(error_message)

            trace = {
                "name": "MasterAgent",
                "input": messages[-1].model_dump(),
                "output": error_message,
                "is_success": False
            }
            return {"messages": [AIMessage(content=error_message)],"trace": [trace]}
