from datetime import datetime
from typing import List, Optional, Self
from uuid import UUID

from pydantic import BaseModel, model_validator
from src.schemas.api.files.dto import FileDTO


class OutgoingMLRequestSchema(BaseModel):
    session_id: UUID | str
    user_id: UUID | str
    configs: dict
    files: Optional[List[FileDTO]] = []
    timestamp: datetime | float | int  # posix ts

    @model_validator(mode="after")
    def validate_uuids(self) -> Self:
        if isinstance(self.session_id, UUID):
            self.session_id = str(self.session_id)
        if isinstance(self.user_id, UUID):
            self.user_id = str(self.user_id)

        if isinstance(self.timestamp, datetime):
            self.timestamp = int(self.timestamp.timestamp())
        return self


class IncomingMLResponseSchema(BaseModel):
    session_id: str
    request_id: str
    agents_plan: List
