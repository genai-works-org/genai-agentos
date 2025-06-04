from datetime import datetime
from typing import List, Optional, Self, Union
from uuid import UUID

from fastapi import HTTPException
from pydantic import BaseModel, field_validator, model_validator
from src.utils.helpers import generate_alias


class FlowAgentId(BaseModel):  # TODO: rename
    agent_id: str

    @field_validator("agent_id")
    def check_if_valid_uuid(cls, v):
        try:
            return str(UUID(v))
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Agent id provided into an agentflow is not a valid UUID",
            )


class AgentFlowBase(BaseModel):
    name: str
    description: str

    flow: List[FlowAgentId]

    @field_validator("name")
    def cast_name_to_alias(cls, v: str):
        return generate_alias(v)


class AgentFlowCreate(AgentFlowBase):
    @field_validator("flow")
    def check_flow_length(cls, v):
        if isinstance(v, list):
            if len(v) > 1:
                return v
            else:
                raise ValueError("Agentflows must contain more than 1 agent")
        return v

    @model_validator(mode="after")
    def check_if_inputs_are_empty(self) -> Self:
        if not self.name:
            raise HTTPException(
                status_code=400, detail="'name' parameter must not be empty string"
            )
        if not self.description:
            raise HTTPException(
                status_code=400,
                detail="'description' parameter must not be empty string",
            )

        return self


class AgentFlowList(AgentFlowBase):
    created_at: datetime
    updated_at: datetime


class AgentFlowUpdate(AgentFlowCreate):
    pass


class AgentFlowAlias(AgentFlowCreate):
    alias: Optional[str] = None


class FlowSchema(BaseModel):
    agent_id: Union[UUID, str]
    agent_name: str
    agent_description: str
    agent_schema: dict

    flow: Optional[List[str]] = []

    @field_validator("agent_id")
    def cast_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v
