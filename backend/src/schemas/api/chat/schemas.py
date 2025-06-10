import json
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator
from src.schemas.base import BaseUUIDToStrModel, CastSessionIDToStrModel
from src.utils.enums import SenderType


class BaseChatMessage(BaseModel):
    sender_type: SenderType
    content: str | dict

    @field_validator("content")
    def cast_dict_to_json_str(cls, v):
        if isinstance(v, dict):
            return json.dumps(v)
        return v


class GetChatMessage(BaseChatMessage):
    request_id: UUID
    created_at: datetime


class CreateChatMessage(BaseChatMessage):
    pass


class DeleteChatMessage(BaseUUIDToStrModel):
    pass


# TODO: Chat message with metadata if needed


class BaseConversation(BaseUUIDToStrModel):
    title: str


class CreateConversation(BaseModel):
    session_id: UUID


class UpdateConversation(BaseModel):
    title: str


class ChatHistoryFilter(CastSessionIDToStrModel):
    chat_id: Optional[str] = None
