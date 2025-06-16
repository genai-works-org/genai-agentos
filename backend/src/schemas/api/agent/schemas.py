from typing import Optional, Union
from uuid import UUID, uuid4

from fastapi import HTTPException
from pydantic import BaseModel, Field, field_validator


class AgentBase(BaseModel):
    name: str
    description: str

    @field_validator("name")
    def check_name_length(cls, v):
        if len(v) <= 55:
            return v.replace(" ", "_").lower()
        raise ValueError("Agent name must be less than 55 characters")


class AgentCreateBase(AgentBase):
    id: Union[str, UUID]

    @field_validator("id")
    def cast_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v


class AgentCreateCLI(AgentCreateBase):
    # This is a separate CLI model as we do not want user to register input schema via CLI
    # but input_schema must not be null in the database
    input_parameters: Optional[dict] = {}


class AgentCreate(AgentCreateBase):
    # NOTE: json as python object and json-string are allowed
    input_parameters: Union[dict, str]  # TODO: validate for description and type fields

    @field_validator("id")
    def cast_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v


class AgentGet(AgentCreate):
    pass


class AgentUpdate(AgentBase):
    input_parameters: Union[dict, str]  # TODO: validate for description and type fields
    # if agent update model is explicitly called -> we assume the agent is active  # noqa: E501
    is_active: bool = True
    alias: Optional[str] = Field(default=None)


class AgentCRUDUpdate(AgentBase):
    input_parameters: Union[dict, str]


class AgentRegister(AgentCreate):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()))
    is_active: Optional[bool] = False  # inactive by default

    @field_validator("id")
    def check_if_id_is_uuid(cls, v):
        try:
            return str(UUID(v))
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Parameter 'id' must be a valid uuid"
            )
        except TypeError:
            raise HTTPException(
                status_code=400, detail="Parameter 'id' must not be a null"
            )


class AgentJWTTokenPayload(BaseModel):
    sub: str  # agent uuid
    exp: int
    user_id: Union[UUID, str]

    @field_validator("user_id")
    def cast_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v
