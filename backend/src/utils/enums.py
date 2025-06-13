from enum import Enum


class AgentPlanType(Enum):
    agent = "agent"
    flow = "flow"


class AgentType(Enum):
    genai = "genai"
    flow = "flow"
    mcp = "mcp"
    a2a = "a2a"


class FileValidationOutputChoice(Enum):
    file_id = "file_id"
    dto = "dto"


class SenderType(Enum):
    user = "user"
    master_agent = "master_agent"


class ActiveAgentTypeFilter(Enum):
    genai = "genai"
    mcp = "mcp"
    a2a = "a2a"
    all = "all"


class AgentIdType(Enum):
    agent_id = "agent_id"
    mcp_tool_id = "mcp_tool_id"
    a2a_card_id = "a2a_card_id"
