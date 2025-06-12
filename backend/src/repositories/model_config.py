from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from src.auth.encrypt import encrypt_secret
from src.models import ModelConfig, User
from src.repositories.base import CRUDBase
from src.schemas.api.model_config.dto import ModelConfigDTO
from src.schemas.api.model_config.schemas import ModelConfigCreate, ModelConfigUpdate


class ModelConfigRepository(
    CRUDBase[ModelConfig, ModelConfigCreate, ModelConfigUpdate]
):
    async def get_config_by_user(
        self, db: AsyncSession, user_model: User, config_id: str
    ) -> Optional[ModelConfigDTO]:
        config = await self.get_by_user(db=db, id_=config_id, user_model=user_model)
        if not config:
            raise HTTPException(
                status_code=400,
                detail=f"Model config with id {config_id} does not exist",
            )

        return ModelConfigDTO(
            id=config_id,
            name=config.name,
            model=config.model,
            provider=config.provider,
            system_prompt=config.system_prompt,
            temperature=config.temperature,
            credentials=config.credentials,
        )

    async def find_model_by_config_name(
        self,
        db: AsyncSession,
        config_name: str,
        user_model: User,
    ) -> Optional[ModelConfig]:
        q = await db.execute(
            select(self.model).where(
                and_(
                    self.model.name == config_name,
                    self.model.creator_id == user_model.id,
                )
            )
        )
        return q.scalars().first()

    async def lookup_provider_for_valid_api_key(
        self, db: AsyncSession, user_model: User, provider_name: str
    ) -> Optional[str]:
        """
        Helper method to lookup existing api_key per provider per user
        as frontend does not store the api_key and sends asterisks after the initial config setting

        Returns:
            encrypted api_key
        """
        q = await db.execute(
            select(self.model)
            .where(
                and_(
                    self.model.provider == provider_name,
                    self.model.creator_id == user_model.id,
                )
            )
            .order_by(self.model.created_at.asc())
        )
        model_config = q.scalars().first()
        if not model_config:
            return

        return model_config.credentials.get("api_key")

    async def create_model_config_with_encryption(
        self,
        db: AsyncSession,
        obj_in: ModelConfigCreate,
        user_model: User,
    ) -> ModelConfig:
        if obj_in.credentials:
            if api_key := obj_in.credentials.get("api_key"):
                obj_in.credentials["api_key"] = encrypt_secret(api_key)
        return await self.create_by_user(db=db, obj_in=obj_in, user_model=user_model)

    async def update_model_config_with_encryption(
        self,
        db: AsyncSession,
        id_: UUID,
        obj_in: ModelConfigUpdate,
        user_model: User,
    ) -> ModelConfig:
        if obj_in.credentials:
            if api_key := obj_in.credentials.get("api_key"):
                obj_in.credentials["api_key"] = encrypt_secret(api_key)
        return await self.update_by_user(db=db, id_=id_, obj_in=obj_in, user=user_model)


model_config_repo = ModelConfigRepository(ModelConfig)
