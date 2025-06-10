import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from genai_session.session import GenAISession
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage

from agents.flow_master_agent import FlowMasterAgent


class AgentTypeEnum(Enum):
    a2a = "a2a"
    mcp = "mcp"
    gen_ai = "genai"
    flow = "flow"


@dataclass
class AgentConfig(ABC):
    id: str
    name: str
    agent_type: str = field(init=False)


@dataclass
class A2AConfig(AgentConfig):
    endpoint: str
    task: str
    text: str
    role: str = "user"
    message_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    action: str = field(init=False)

    def __post_init__(self):
        self.agent_type = AgentTypeEnum.a2a.value
        self.action = f"{self.task}\n{self.text}"


@dataclass
class MCPConfig(AgentConfig):
    endpoint: str
    arguments: dict

    def __post_init__(self):
        self.agent_type = AgentTypeEnum.mcp.value


@dataclass
class GenAIConfig(AgentConfig):
    arguments: dict
    session: GenAISession

    def __post_init__(self):
        self.agent_type = AgentTypeEnum.gen_ai.value


@dataclass
class GenAIFlowConfig(AgentConfig):
    agents: list[dict[str, Any]]
    model: BaseChatModel
    messages: list[BaseMessage]
    session: GenAISession
    flow_master_agent: FlowMasterAgent = field(init=False)

    def __post_init__(self):
        self.agent_type = AgentTypeEnum.flow.value
        self.flow_master_agent = FlowMasterAgent(
            model=self.model,
            agents=self.agents
        )


class ConnectorStrategy(ABC):
    def __init__(self, config: AgentConfig):
        self.config = config

    @abstractmethod
    async def invoke(self, *args, **kwargs) -> dict:
        pass
