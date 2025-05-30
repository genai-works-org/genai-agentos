from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel
from src.schemas.base import BaseUUIDToStrModel, CastSessionIDToStrModel
from src.utils.enums import SenderType


class BaseChatMessage(BaseModel):
    sender_type: SenderType
    content: str


class GetChatMessage(BaseChatMessage):
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
