from datetime import datetime
from typing import List, Optional, Self, Union
from uuid import UUID

from fastapi import HTTPException
from pydantic import BaseModel, field_validator, model_validator


class FlowAgentId(BaseModel):
    agent_id: Optional[str] = None  # genai agent
    mcp_tool_id: Optional[str] = None
    a2a_card_id: Optional[str] = None

    @model_validator(mode="after")
    def validate_uuids(self) -> Self:
        try:
            self.agent_id = str(UUID(self.agent_id)) if self.agent_id else None
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="GenAI agent id provided into an agentflow is not a valid UUID",
            )

        try:
            self.mcp_tool_id = str(UUID(self.mcp_tool_id)) if self.mcp_tool_id else None
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="MCP tool id provided into an agentflow is not a valid UUID",
            )

        try:
            self.a2a_card_id = str(UUID(self.a2a_card_id)) if self.a2a_card_id else None
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="A2A agent id provided into an agentflow is not a valid UUID",
            )

        if all([self.agent_id, self.mcp_tool_id, self.a2a_card_id]):
            raise HTTPException(
                status_code=400,
                detail="'flow' expects either 'agent_id' or 'mcp_tool_id' or 'a2a_card_id' params, but not all of them at the same time.",  # noqa: E501
            )
        if (
            len([v for v in (self.agent_id, self.mcp_tool_id, self.a2a_card_id) if v])
            > 1
        ):
            raise HTTPException(
                status_code=400,
                detail="'flow' expects only one of 'agent_id' or 'mcp_tool_id' or 'a2a_card_id' params, but not multiple at the same time",  # noqa: E501
            )
        return self

    def to_json(self):
        if self.agent_id:
            return {"agent_id": self.agent_id}

        if self.mcp_tool_id:
            return {"mcp_tool_id": self.mcp_tool_id}

        if self.a2a_card_id:
            return {"a2a_card_id": self.a2a_card_id}


class AgentFlowBase(BaseModel):
    name: str
    description: str

    flow: List[FlowAgentId]


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
