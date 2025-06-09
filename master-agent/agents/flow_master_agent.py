from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage
from loguru import logger

from agents.base import BaseMasterAgent
from models.states import MasterAgentState
from utils.agents import select_agent_and_resolve_parameters
from utils.tracing import trace_execution_time


class FlowMasterAgent(BaseMasterAgent):
    def __init__(
            self,
            model: BaseChatModel,
            agents: list[dict[str, Any]], # ordered list of agents to execute
    ) -> None:
        super().__init__(model=model, agents=agents)

    async def select_agent(self, state: MasterAgentState):
        messages = state.messages
        trace = {
            "name": "MasterAgent",
            "input": messages[-1].model_dump(),
        }

        try:
            if self._agents_to_bind_to_llm:
                agent_to_execute = self._agents_to_bind_to_llm.pop(0)  # get agent from the top of the list
                logger.info(f"Resolving parameters for {agent_to_execute.get("name")} in the flow")

                async with trace_execution_time(trace=trace):
                    response = await select_agent_and_resolve_parameters(
                        model=self.model,
                        messages=messages,
                        agents=[agent_to_execute],
                        agent_choice=True  # force the current agent to be called
                    )

                logger.success(
                    f"Agent {agent_to_execute.get('name')} will be executed with args {response.tool_calls[0]["args"]}"
                )

                trace.update(
                    {
                        "output": response.model_dump(),
                        "is_success": True
                    }
                )
                return {"messages": [response], "trace": [trace]}

        except Exception as e:
            error_message = f"Unexpected error while resolving parameters for agent in the flow: {e}"
            logger.exception(error_message)

            trace = {
                "name": "MasterAgent",
                "input": messages[-1].model_dump(),
                "output": error_message,
                "is_success": False
            }
            return {"messages": [AIMessage(content=error_message)], "trace": [trace]}
