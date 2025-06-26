from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException, Query, Response
from src.auth.dependencies import CurrentUserDependency
from src.core.settings import get_settings
from src.db.session import AsyncDBSession
from src.repositories.chat import chat_repo
from src.schemas.api.chat.schemas import CreateConversation, UpdateConversation
from src.utils.helpers import get_user_id_from_jwt

chat_router = APIRouter(tags=["chat"])
settings = get_settings()


@chat_router.get("/chats")
async def list_existing_chats(
    db: AsyncDBSession,
    user_model: CurrentUserDependency,
    offset: int = 0,
    limit: int = 100,
):
    return await chat_repo.list_chats(
        db=db, user_model=user_model, offset=offset, limit=limit
    )


@chat_router.get("/chat")
async def get_chat_history(
    db: AsyncDBSession,
    session_id: UUID = Query(),
    x_api_key: Annotated[Optional[str], Header(convert_underscores=True)] = None,
    user_id: Optional[UUID] = Query(None),
    authorization: Annotated[Optional[str], Header()] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=0),
):
    if not any((user_id, authorization)):
        raise HTTPException(
            status_code=400,
            detail="You must provide either 'user_id' or your jwt token to continue.",
        )

    if all((authorization, x_api_key, user_id)):
        raise HTTPException(
            status_code=400,
            detail="You must provide either 'user_id' or your jwt token, but not both at the same time.",
        )

    if all((authorization, user_id)):
        raise HTTPException(
            status_code=400,
            detail="Lookup by user_id is not allowed for plain authenticated users.",
        )

    if not user_id and not authorization:
        if not x_api_key == settings.MASTER_BE_API_KEY:
            raise HTTPException(
                detail="You must provide x-api-key header if user_id query parameter is provided.",
                status_code=401,
            )
        user_id = get_user_id_from_jwt(token=authorization.split(" ")[-1])

    if authorization:
        user_id = get_user_id_from_jwt(token=authorization.split(" ")[-1])

    history = await chat_repo.get_paginated_chat_history(
        db=db,
        user_id=user_id,
        session_id=session_id,
        page=page,
        per_page=per_page,
    )
    if not history:
        return []

    return history


@chat_router.post("/chats")
async def create_new_chat(
    db: AsyncDBSession,
    user_model: CurrentUserDependency,
    message_in: CreateConversation,
):
    return await chat_repo.create_chat_by_session_id(
        db=db,
        user_model=user_model,
        session_id=message_in.session_id,
        initial_user_message=message_in.title,
    )


@chat_router.patch("/chat")
async def update_chat(
    db: AsyncDBSession,
    user_model: CurrentUserDependency,
    update_in: UpdateConversation,
    session_id: UUID = Query(),
):
    result = await chat_repo.update_chat_by_session_id(
        db=db, session_id=session_id, user_model=user_model, obj_in=update_in
    )
    if not result:
        raise HTTPException(
            detail=f"Chat with session_id {session_id} does not exist",
            status_code=400,
        )

    return result


@chat_router.delete("/chat")
async def delete_chat(
    db: AsyncDBSession, user_model: CurrentUserDependency, session_id: UUID = Query()
):
    is_ok = await chat_repo.delete_chat_by_session_id(
        db=db, user_model=user_model, session_id=session_id
    )
    if not is_ok:
        raise HTTPException(
            status_code=400,
            detail=f"Chat with session_id: '{session_id}' does not exist",
        )

    return Response(status_code=204)
