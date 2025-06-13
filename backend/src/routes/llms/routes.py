import logging
import traceback
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from sqlalchemy.exc import IntegrityError

from src.auth.dependencies import CurrentUserDependency
from src.db.session import AsyncDBSession
from src.repositories.model_config import model_config_repo
from src.schemas.api.model_config.dto import ModelConfigDTO, ModelPromptDTO
from src.schemas.api.model_config.schemas import ModelConfigCreate, ModelConfigUpdate
from src.utils.constants import DEFAULT_SYSTEM_PROMPT

logger = logging.getLogger(__name__)
llm_router = APIRouter(prefix="/llm", tags=["LLM"])


@llm_router.get("/model/configs", response_model=list[ModelConfigDTO])
async def list_model_configs(
    db: AsyncDBSession,
    user_model: CurrentUserDependency,
    limit: int = 100,
    offset: int = 0,
):
    return await model_config_repo.get_multiple_by_user(
        db=db, user_model=user_model, limit=limit, offset=offset
    )


@llm_router.get("/model/config/{model_config_id}", response_model=ModelConfigDTO)
async def get_model_config(
    db: AsyncDBSession, user_model: CurrentUserDependency, model_config_id: UUID
):
    return await model_config_repo.get_config_by_user(
        db=db, config_id=model_config_id, user_model=user_model
    )


@llm_router.post(
    "/model/config",
)
async def add_model_config(
    db: AsyncDBSession,
    user_model: CurrentUserDependency,
    model_config_in: ModelConfigCreate,
):
    try:
        return await model_config_repo.create_model_config_with_encryption(
            db=db, obj_in=model_config_in, user_model=user_model
        )

    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail=f"Model config named '{model_config_in.name}' already exists",
        )
    except Exception:
        logger.error(f"Unexpected error occured: {traceback.format_exc(limit=600)}")
        raise HTTPException(
            status_code=500, detail="Unexpected error occured, try again later."
        )


@llm_router.patch("/model/config/{model_config_id}", response_model=ModelConfigDTO)
async def update_model_config(
    db: AsyncDBSession,
    user_model: CurrentUserDependency,
    model_config_id: UUID,
    model_config_in: ModelConfigUpdate,
):
    return await model_config_repo.update_model_config_with_encryption(
        db=db, id_=model_config_id, user_model=user_model, obj_in=model_config_in
    )


@llm_router.delete("/model/config/{model_config_id}")
async def delete_model_config(
    db: AsyncDBSession,
    user_model: CurrentUserDependency,
    model_config_id: UUID,
):
    is_ok = await model_config_repo.delete_by_user(
        db=db, id_=model_config_id, user=user_model
    )
    if is_ok:
        return Response(status_code=204)


@llm_router.get("/model/prompt", response_model=ModelPromptDTO)
async def get_model_prompt(
    db: AsyncDBSession,
    user_model: CurrentUserDependency,
    provider: Optional[str] = None,
    model: Optional[str] = None,
):
    return ModelPromptDTO(default_system_prompt=DEFAULT_SYSTEM_PROMPT)
