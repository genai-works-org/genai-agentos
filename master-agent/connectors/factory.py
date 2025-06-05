from connectors.entities import ConnectorStrategy, AgentConfig, AgentTypeEnum
from connectors.exceptions import InvokeManagerNotFoundException
from connectors.managers import GenAIFlowConnector, MCPConnector, A2AConnector, GenAIConnector


class ConnectorFactory:
    _strategies: dict[str, type(ConnectorStrategy)] = {
        AgentTypeEnum.mcp.value: MCPConnector,
        AgentTypeEnum.a2a.value: A2AConnector,
        AgentTypeEnum.gen_ai.value: GenAIConnector,
        AgentTypeEnum.flow.value: GenAIFlowConnector
    }

    @classmethod
    def get_connector(cls, config: AgentConfig) -> ConnectorStrategy:
        if strategy_cls := cls._strategies.get(config.agent_type):
            return strategy_cls(config)
        raise InvokeManagerNotFoundException(f"Unsupported agent type: {config.agent_type}")
