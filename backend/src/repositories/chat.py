import copy
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import and_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from src.models import ChatConversation, ChatMessage, User
from src.repositories.base import CRUDBase
from src.schemas.api.chat.dto import BaseChatDTO, ChatDetailsDTO, ListChatsDTO
from src.schemas.api.chat.schemas import (
    BaseChatMessage,
    CreateConversation,
    GetChatMessage,
    UpdateConversation,
)
from src.utils.helpers import prettify_integrity_error_details
from src.utils.pagination import paginate


class ChatRepository(
    CRUDBase[ChatConversation, CreateConversation, UpdateConversation]
):
    async def list_chats(
        self, db: AsyncSession, user_model: User, offset: int = 0, limit: int = 100
    ):
        chats = await self.get_multiple_by_user(
            db=db, user_model=user_model, offset=offset, limit=limit
        )
        return ListChatsDTO(chats=[BaseChatDTO(**chat.__dict__) for chat in chats])

    async def get_chat_history(
        self, db: AsyncSession, user_model: User, session_id: UUID
    ):
        q = await db.execute(
            select(self.model)
            .options(joinedload(self.model.messages))
            .where(
                and_(
                    self.model.session_id == session_id,
                    self.model.creator_id == str(user_model.id),
                )
            )
        )
        chat = q.scalars().first()
        if not chat:
            return

        return ChatDetailsDTO(
            title=chat.title,
            created_at=chat.created_at,
            updated_at=chat.updated_at,
            session_id=chat.session_id,
            messages=[GetChatMessage(**msg.__dict__) for msg in chat.messages],
        )

    async def get_paginated_chat_history(
        self,
        db: AsyncSession,
        user_id: UUID,
        session_id: UUID,
        page: int,
        per_page: int,
    ):
        q = (
            select(ChatMessage)
            .join(self.model.messages)
            .where(
                and_(
                    self.model.session_id == session_id,
                    self.model.creator_id == user_id,
                )
            )
            .order_by(ChatMessage.created_at.desc())
        )
        return await paginate(
            db=db, query=q, cast_to=GetChatMessage, page=page, per_page=per_page
        )

    async def get_chat_by_session_id(
        self, db: AsyncSession, user_model: User, session_id: UUID
    ):
        q = await db.execute(
            select(self.model)
            .where(
                and_(
                    self.model.session_id == session_id,
                    self.model.creator_id == user_model.id,
                )
            )
            .order_by(self.model.created_at.desc())
        )
        return q.scalars().first()

    async def get_chat_history_by_session_id(
        self, db: AsyncSession, user_model: User, session_id: str
    ):
        q = await db.execute(
            select(self.model)
            .options(joinedload(self.model.messages))
            .where(
                and_(
                    self.model.session_id == session_id,
                    self.model.creator_id == user_model.id,
                )
            )
        )
        return q.scalars().first()

    async def create_chat_by_session_id(
        self,
        db: AsyncSession,
        user_model: User,
        session_id: UUID,
        initial_user_message: str,
    ) -> ChatConversation:
        """
        Method to create chat by session_id

        Title of the chat is the uuid for the time being, should be changed afterwards when
        LLM sumarization of the initial message would be inserted into the title of the conversation
        """
        try:
            chat = ChatConversation(
                title=initial_user_message,
                creator_id=user_model.id,
                session_id=session_id,
            )
            db.add(chat)
            await db.commit()
            await db.refresh(chat)
            return chat
        except IntegrityError as e:
            msg = str(e._message())
            detail = prettify_integrity_error_details(msg=msg)
            raise HTTPException(
                status_code=400,
                detail=f"Chat with {detail.column.capitalize()} - '{detail.value}' already exists",
            )

        except ValueError as e:
            raise e

    async def update_chat_by_session_id(
        self,
        db: AsyncSession,
        user_model: User,
        session_id: UUID,
        obj_in: UpdateConversation,
    ):
        existing_chat = await self.get_chat_by_session_id(
            db=db, user_model=user_model, session_id=session_id
        )
        if not existing_chat:
            return None

        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        for field in update_data:
            if hasattr(existing_chat, field):
                setattr(existing_chat, field, update_data[field])

        db.add(existing_chat)
        await db.commit()
        await db.refresh(existing_chat)
        return existing_chat

    async def delete_chat_by_session_id(
        self, db: AsyncSession, user_model: User, session_id: UUID
    ):
        obj = await db.execute(
            select(self.model).where(
                and_(
                    self.model.creator_id == user_model.id,
                    self.model.session_id == str(session_id),
                )
            )
        )
        obj = obj.scalars().first()
        if not obj:
            return None
        await db.delete(obj)
        await db.commit()
        # result returns either cursor obj or None
        return obj

    async def add_message_to_conversation(
        self,
        db: AsyncSession,
        user_model: User,
        session_id: str,
        request_id: str,
        message_in: BaseChatMessage,
    ):
        user = copy.deepcopy(user_model)

        chat = await self.get_chat_history_by_session_id(
            db=db, user_model=user_model, session_id=session_id
        )
        if not chat:
            raise HTTPException(
                detail=f"Chat with session_id: '{session_id}' does not exist",
                status_code=400,
            )

        new_message = ChatMessage(
            sender_type=message_in.sender_type,
            content=message_in.content,
            conversation_id=session_id,
            request_id=request_id,
        )
        db.add(new_message)
        await db.commit()
        await db.refresh(new_message)

        return await self.get_chat_history(
            db=db, user_model=user, session_id=session_id
        )


chat_repo = ChatRepository(ChatConversation)
