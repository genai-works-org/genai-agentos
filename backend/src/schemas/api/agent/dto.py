from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field
from src.schemas.api.agent.schemas import AgentGet
from src.schemas.api.files.dto import FileDTO
from src.schemas.ws.frontend import AgentResponseDTO
from src.utils.enums import AgentType


class MLAgentSchema(BaseModel):
    agent_id: str
    agent_name: str
    agent_description: str
    agent_schema: dict[str, Any]


class MLAgentDTO(MLAgentSchema):
    created_at: datetime
    updated_at: datetime
    is_active: bool


class MLAgentJWTDTO(MLAgentDTO):
    agent_jwt: Optional[str] = None
    agent_alias: Optional[str] = None


class AgentDTO(AgentGet):
    id: Union[UUID, str]
    created_at: datetime
    updated_at: datetime


class AgentsDTO(BaseModel):
    agents: List[AgentDTO]


class ActiveAgentsDTO(BaseModel):
    count_active_connections: int
    active_connections: List[Optional[Dict[str, Any]]]


class ActiveAgentsWithQueryParams(ActiveAgentsDTO):
    limit: int
    offset: int


class AgentResponseWithFilesDTO(AgentResponseDTO):
    files: List[Optional[FileDTO]] = []


class AgentTypeResponseDTO(BaseModel):
    type: str = "agent_response"  # TODO:enum
    response: AgentResponseWithFilesDTO


class AgentDTOWithJWT(AgentDTO):
    alias: str
    jwt: Optional[str] = None


class ActiveGenAIAgentDTO(MLAgentJWTDTO):
    type: AgentType = Field(default_factory=lambda _: AgentType.genai)
