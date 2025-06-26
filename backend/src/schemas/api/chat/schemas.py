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


class BaseConversationWithTitle(BaseModel):
    title: str

    @field_validator("title")
    def check_len(cls, v: str):
        if len(v) > 20:
            raise ValueError("Chat title must not be longer than 20 symbols")

        if len(v) < 1:
            raise ValueError("Chat title must not be empty")

        return v


class CreateConversation(BaseConversationWithTitle):
    session_id: UUID


class UpdateConversation(BaseConversationWithTitle):
    pass


class ChatHistoryFilter(CastSessionIDToStrModel):
    chat_id: Optional[str] = None
