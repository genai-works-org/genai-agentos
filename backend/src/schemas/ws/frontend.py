from typing import List, Optional, Self, Union
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator
from src.auth.encrypt import decrypt_secret


class Flow(BaseModel):
    pass


class Flows(BaseModel):
    flows: List[Flow]


class InputParams(BaseModel):
    name: str
    description: str


class Agent(BaseModel):
    id: str
    type: str
    input_params: InputParams


class AgentsPlanItem(BaseModel):
    id: str
    type: str
    agents: Optional[List[Agent]] = None
    input_params: Optional[InputParams] = None


class IncomingWebsocketFrontendMessage(BaseModel):
    message: str
    session_id: str
    request_id: str
    agents: List[Agent]
    flows: Flows


class MLResponseToFrontendDTO(BaseModel):
    response: str
    session_id: str
    request_id: str
    agents_plan: List[AgentsPlanItem]


class LLMProperties(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = Field(default=0.7)
    system_prompt: Optional[str] = None
    user_prompt: Optional[str] = None
    max_last_messages: Optional[int] = Field(default=5)

    config_name: str
    credentials: Optional[dict] = {}

    def to_json(self):
        return {
            "provider": self.provider,
            "model": self.model,
            "temperature": self.temperature,
            "system_prompt": self.system_prompt,
            "user_prompt": self.user_prompt,
            "config_name": self.config_name,
            "max_last_messages": self.max_last_messages,
            **self.credentials,
        }


class LLMPropertiesDecryptCreds(LLMProperties):
    @field_validator("credentials")
    def validate_provider_model(cls, v):
        if v:
            if api_key := v.get("api_key"):
                v["api_key"] = decrypt_secret(api_key)
                return v
        return v


class LLMPropertiesDTO(BaseModel):
    llm: Optional[dict] = {}


class IncomingFrontendMessage(BaseModel):
    message: str
    provider: str
    llm_name: str
    files: Optional[List[str]] = []


class AgentResponseDTO(BaseModel):
    execution_time: float
    response: Union[dict, str]
    request_id: Union[UUID, str]
    session_id: Union[UUID, str]

    @model_validator(mode="after")
    def cast_uuid_to_str(self) -> Self:
        self.request_id = str(self.request_id)
        self.session_id = str(self.session_id)
        return self
