from pathlib import Path
from typing import Optional, Self, Union
from uuid import UUID

from pydantic import BaseModel, field_validator, model_validator
from src.schemas.api.files.schemas import FileGet


class FileIdDTO(BaseModel):
    id: str


class FileDTO(FileGet):
    id: Union[UUID, str]
    session_id: Optional[Union[UUID, str]] = None
    request_id: Optional[Union[UUID, str]] = None
    internal_id: Union[UUID, str]
    creator_id: Optional[Union[UUID, str]] = None

    @model_validator(mode="after")
    def cast_uuid_from_str(self) -> Self:
        self.id = str(self.id)
        self.session_id = (
            str(self.session_id)
            if isinstance(self.session_id, UUID)
            else self.session_id
        )
        self.request_id = (
            str(self.request_id)
            if isinstance(self.request_id, UUID)
            else self.request_id
        )
        self.internal_id = (
            str(self.internal_id)
            if isinstance(self.internal_id, UUID)
            else self.internal_id
        )
        self.creator_id = (
            str(self.creator_id)
            if isinstance(self.creator_id, UUID)
            else self.creator_id
        )
        return self


class FilePathDTO(BaseModel):
    fp: Union[Path, str]
    mime_type: str
    file_name: str

    @field_validator("file_name")
    def cast_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v


class ShortFileDTO(BaseModel):
    file_id: UUID
    session_id: UUID
    request_id: UUID
