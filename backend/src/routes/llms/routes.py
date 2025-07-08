import logging
import traceback
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import CurrentUserDependency
from src.db.session import AsyncDBSession, get_middleware_db
from src.repositories.model_config import model_config_repo
from src.schemas.api.model_config.dto import (
    ModelConfigDTO,
    ModelPromptDTO,
    ModelProviderCreateDTO,
    ModelProviderUpdateDTO,
)
from src.schemas.api.model_config.schemas import (
    ModelConfigCreate,
    ModelConfigUpdate,
    ProviderCRUDCreate,
    ProviderCRUDUpdate,
)
from src.utils.constants import DEFAULT_SYSTEM_PROMPT
from src.utils.helpers import prettify_integrity_error_details

logger = logging.getLogger(__name__)
llm_router = APIRouter(prefix="/llm", tags=["LLM"])


@llm_router.get("/model/configs")
async def list_model_configs(
    user_model: CurrentUserDependency,
    db: AsyncSession = Depends(get_middleware_db),
    limit: int = 100,
    offset: int = 0,
):
    return await model_config_repo.get_all_configs_of_all_providers(
        db=db, user_model=user_model, limit=limit, offset=offset
    )


@llm_router.get("/model/config/{model_config_id}")
async def get_model_config(
    db: AsyncDBSession, user_model: CurrentUserDependency, model_config_id: UUID
):
    return await model_config_repo.get_config_by_user(
        db=db, config_id=model_config_id, user_model=user_model
    )


@llm_router.post("/model/provider")
async def add_model_provider(
    db: AsyncDBSession,
    user_model: CurrentUserDependency,
    provider_in: ProviderCRUDCreate,
):
    try:
        p = await model_config_repo.create_provider(
            db=db, provider_in=provider_in, user_model=user_model
        )
        return ModelProviderCreateDTO(
            id=p.id,
            provider=p.name,
            metadata=p.provider_metadata,
            api_key=p.api_key,
            created_at=p.created_at,
            updated_at=p.updated_at,
        ).model_dump(exclude_none=True, mode="json")

    except IntegrityError as e:
        msg = str(e._message())
        detail = prettify_integrity_error_details(msg=msg)
        raise HTTPException(
            status_code=400,
            detail=f"{detail.column.capitalize()} - '{detail.value}' already exists",
        )
    except Exception:
        logger.error(f"Unexpected error occured: {traceback.format_exc(limit=600)}")
        raise HTTPException(
            status_code=500, detail="Unexpected error occured, try again later."
        )


@llm_router.post("/model/config")
async def add_model_config(
    db: AsyncDBSession,
    user_model: CurrentUserDependency,
    model_config_in: ModelConfigCreate,
):
    try:
        return await model_config_repo.create_model_config_with_encryption(
            db=db, obj_in=model_config_in, user_model=user_model
        )

    except HTTPException as e:
        raise e

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


@llm_router.patch("/model/providers/{provider_name}")
async def update_provider(
    db: AsyncDBSession,
    user_model: CurrentUserDependency,
    provider_name: str,
    provider_upd_in: ProviderCRUDUpdate,
):
    provider = await model_config_repo.get_provider_by_name(
        db=db, provider_name=provider_name, user_id=user_model.id
    )
    if not provider:
        raise HTTPException(
            detail=f"Provider named '{provider_name}' does not exist", status_code=400
        )

    p = await model_config_repo.update_provider(
        db=db, provider_obj=provider, upd_in=provider_upd_in
    )
    return ModelProviderUpdateDTO(
        id=p.id,
        api_key=p.api_key,
        provider=p.name,
        metadata=p.provider_metadata,
        created_at=p.created_at,
        updated_at=p.updated_at,
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


@llm_router.get("/hackathon/genai")
async def get_genai_provider_data(
    db: AsyncDBSession,
    user_model: CurrentUserDependency,
):
    return await model_config_repo.get_default_genai_provider(
        db=db, user_id=user_model.id
    )
