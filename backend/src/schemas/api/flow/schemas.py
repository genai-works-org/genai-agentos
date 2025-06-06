from datetime import datetime
from typing import Optional, Self, Union
from uuid import UUID

from fastapi import HTTPException
from pydantic import BaseModel, field_validator, model_validator
from src.utils.enums import AgentType


class FlowAgentId(BaseModel):
    id: str = None
    type: str = None

    @field_validator("id")
    def validate_id_is_uuid(cls, v) -> str:
        try:
            UUID(v)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail="Agent ID is not a valid UUID",
            )
        return v

    @field_validator("type")
    def validate_type(cls, v) -> str:
        if v not in (AgentType.genai.value, AgentType.mcp.value, AgentType.a2a.value):
            raise HTTPException(
                status_code=400,
                detail=f"Agent type must be one of '{AgentType.genai.value}', '{AgentType.mcp.value}', or '{AgentType.a2a.value}'",
            )

        return v

    def to_json(self) -> dict:
        return {"id": self.id, "type": self.type}

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

    flow: list[FlowAgentId]

    @field_validator("name")
    def check_name_length(cls, v):
        if len(v) <= 55:
            return v.replace(" ", "_").lower()
        raise ValueError("Flow name must be less than 55 characters")


class AgentFlowCreate(AgentFlowBase):
    @field_validator("flow")
    def check_flow_length(cls, v):
        if isinstance(v, (list, tuple)) and len(v) > 1:
            return v
        raise ValueError("Agentflow must contain more than 1 agent")

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

    flow: Optional[list[str]] = []

    @field_validator("agent_id")
    def cast_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v
