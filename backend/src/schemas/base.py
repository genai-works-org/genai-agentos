from typing import Optional, Union
from uuid import UUID

from pydantic import BaseModel, field_validator


class BaseUUIDToStrModel(BaseModel):
    id: Union[UUID, str]

    @field_validator("id")
    def cast_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v


class CastSessionIDToStrModel(BaseModel):
    session_id: Optional[str | UUID] = None

    @field_validator("session_id")
    def cast_session_id_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v
