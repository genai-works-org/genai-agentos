from typing import List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, field_validator
from src.schemas.api.flow.schemas import AgentFlowList


class AgentFlowDTO(AgentFlowList):
    id: Union[UUID, str]
    is_active: Optional[bool] = None

    @field_validator("id")
    def cast_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v


class AgentFlowsList(BaseModel):
    flows: List[AgentFlowDTO]
