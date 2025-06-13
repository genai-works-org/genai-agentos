from datetime import datetime

from pydantic import BaseModel
from src.schemas.api.chat.schemas import GetChatMessage
from src.schemas.base import CastSessionIDToStrModel


class BaseChatDTO(CastSessionIDToStrModel):
    title: str
    created_at: datetime
    updated_at: datetime


class ListChatsDTO(BaseModel):
    chats: list[BaseChatDTO]


class ChatDetailsDTO(BaseChatDTO):
    messages: list[GetChatMessage]
