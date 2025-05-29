from datetime import datetime
from typing import Optional

from pydantic import Field

from src.schemas.a2a.schemas import A2AAgentCard
from src.schemas.base import BaseUUIDToStrModel
from src.utils.enums import AgentType


class A2ACardDTO(BaseUUIDToStrModel):
    name: str
    description: str
    server_url: str
    # dict type is due to {} being a default value for the json field in DB
    card_content: Optional[A2AAgentCard | dict] = None


class ActiveA2ACardDTO(A2AAgentCard):
    type: AgentType = Field(default=AgentType.a2a)
    server_url: str
    created_at: datetime
    updated_at: datetime
