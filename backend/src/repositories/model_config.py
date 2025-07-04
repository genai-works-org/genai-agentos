from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.auth.encrypt import decrypt_secret
from src.models import ModelConfig, ModelProvider, User
from src.repositories.base import CRUDBase
from src.schemas.api.model_config.dto import ModelConfigDTO, ModelProviderDTO
from src.schemas.api.model_config.schemas import (
    ModelConfigCreate,
    ModelConfigUpdate,
    ProviderCRUDCreate,
    ProviderCRUDUpdate,
)
from src.utils.helpers import validate_and_encrypt_provider_api_key


class ModelConfigRepository(
    CRUDBase[ModelConfig, ModelConfigCreate, ModelConfigUpdate]
):
    async def get_config_by_user(
        self, db: AsyncSession, user_model: User, config_id: str
    ):
        c = await self.get_by_user(db=db, id_=config_id, user_model=user_model)
        if not c:
            raise HTTPException(
                status_code=400, detail=f"Config with id '{config_id}' was not found"
            )

        p = await db.scalar(
            select(ModelProvider)
            .options(selectinload(ModelProvider.configs))
            .join(self.model, self.model.provider_id == ModelProvider.id)
            .where(
                and_(
                    self.model.id == config_id,
                    ModelProvider.creator_id == user_model.id,
                )
            )
        )

        return ModelProviderDTO(
            provider=p.name,
            api_key=p.api_key,
            configs=[
                ModelConfigDTO(
                    id=c.id,
                    name=c.name,
                    model=c.model,
                    system_prompt=c.system_prompt,
                    temperature=c.temperature,
                    credentials=c.credentials,
                    user_prompt=c.user_prompt,
                    max_last_messages=c.max_last_messages,
                )
            ],
            metadata=p.provider_metadata,
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

    async def create_model_config(
        self,
        db: AsyncSession,
        obj_in: ModelConfigCreate,
        user_id: UUID,
        provider_id: UUID,
    ):
        config = ModelConfig(
            name=obj_in.name,
            model=obj_in.model,
            provider_id=provider_id,
            system_prompt=obj_in.system_prompt,
            max_last_messages=obj_in.max_last_messages,
            temperature=obj_in.temperature,
            credentials=obj_in.credentials,
            creator_id=user_id,
            user_prompt=obj_in.user_prompt,
        )
        db.add(config)
        await db.commit()
        await db.refresh(config)
        return config

    async def get_all_provider_configs(
        self, db: AsyncSession, provider_name: str, user_id: UUID
    ) -> list[Optional[ModelProviderDTO]]:
        q = await db.scalars(
            select(ModelProvider)
            .options(selectinload(ModelProvider.configs))
            .where(
                and_(
                    ModelProvider.name == provider_name,
                    ModelProvider.creator_id == user_id,
                )
            )
        )
        return [
            ModelProviderDTO(
                provider=p.name,
                api_key=p.api_key,
                configs=[
                    ModelConfigDTO(
                        id=c.id,
                        name=c.name,
                        model=c.model,
                        system_prompt=c.system_prompt,
                        temperature=c.temperature,
                        credentials=c.credentials,
                        user_prompt=c.user_prompt,
                        max_last_messages=c.max_last_messages,
                    )
                    for c in p.configs
                ][::-1],  # desc sort, TODO: rework
            )
            for p in q.all()
        ]

    async def get_model_config(self, db: AsyncSession, id_: UUID, user_model: User):
        c = await db.scalar(
            select(self.model).where(
                and_(self.model.id == id_, self.model.creator_id == user_model.id)
            )
        )
        return ModelConfigDTO(
            id=c.id,
            name=c.name,
            model=c.model,
            system_prompt=c.system_prompt,
            temperature=c.temperature,
            credentials=c.credentials,
            user_prompt=c.user_prompt,
            max_last_messages=c.max_last_messages,
        )

    async def create_model_config_with_encryption(
        self,
        db: AsyncSession,
        obj_in: ModelConfigCreate,
        user_model: User,
    ) -> ModelConfig:
        user_id = user_model.id
        provider = await self.get_provider_by_name(
            db=db, provider_name=obj_in.provider, user_id=user_id
        )
        if not provider:
            raise HTTPException(
                status_code=400,
                detail=f"Provider named {obj_in.provider} does not exist",
            )
        await self.create_model_config(
            db=db, obj_in=obj_in, user_id=user_id, provider_id=provider.id
        )
        await db.refresh(provider)
        dto = await self.get_all_provider_configs(
            db=db, provider_name=provider.name, user_id=user_id
        )
        return dto

    async def update_model_config_with_encryption(
        self,
        db: AsyncSession,
        id_: UUID,
        obj_in: ModelConfigUpdate,
        user_model: User,
    ) -> ModelConfig:
        cfg = await self.get_model_config(db=db, id_=id_, user_model=user_model)
        if not cfg:
            raise HTTPException(detail=f"Config with '{str(id_)}' does not exist")
        return await self.update_by_user(
            db=db, id_=cfg.id, user=user_model, obj_in=obj_in
        )

    async def get_provider_by_name(
        self, db: AsyncSession, provider_name: str, user_id: UUID
    ) -> ModelProvider:
        p = await db.scalar(
            select(ModelProvider).where(
                and_(
                    ModelProvider.name == provider_name,
                    ModelProvider.creator_id == user_id,
                )
            )
        )
        return p

    async def get_provider_with_configs_by_name(
        self, db: AsyncSession, provider_name: str, user_model: User
    ):
        p = await db.scalar(
            select(ModelProvider)
            .options(selectinload(ModelProvider.configs))
            .where(
                and_(
                    ModelProvider.name == provider_name,
                    ModelProvider.creator_id == user_model.id,
                )
            )
        )
        return p

    async def get_all_configs_of_all_providers(
        self, db: AsyncSession, user_model: User, limit: int, offset: int
    ):
        q = await db.scalars(
            select(ModelProvider)
            .options(selectinload(ModelProvider.configs))
            .where(
                and_(
                    ModelProvider.creator_id == user_model.id,
                )
            )
            .order_by(ModelProvider.created_at.desc())
            .limit(limit=limit)
            .offset(offset=offset)
        )
        return [
            ModelProviderDTO(
                provider=p.name,
                api_key=p.api_key,
                configs=[
                    ModelConfigDTO(
                        id=c.id,
                        name=c.name,
                        model=c.model,
                        system_prompt=c.system_prompt,
                        temperature=c.temperature,
                        credentials=c.credentials,
                        user_prompt=c.user_prompt,
                        max_last_messages=c.max_last_messages,
                    )
                    for c in p.configs
                ],
                metadata=p.provider_metadata,
            )
            for p in q.all()
        ]

    async def update_provider(
        self,
        db: AsyncSession,
        provider_obj: ModelProvider,
        upd_in: ProviderCRUDUpdate,
    ) -> ModelProvider:
        # if provider == ollama, do not validate api_key
        if provider_obj.name.lower().strip() == "ollama":
            upd_in.api_key = None
            return await self.update(db=db, db_obj=provider_obj, obj_in=upd_in.dump())

        try:
            new_api_key = decrypt_secret(upd_in.api_key)
            prev_api_key = decrypt_secret(provider_obj.api_key)
            if prev_api_key == new_api_key:
                return await self.update(
                    db=db, db_obj=provider_obj, obj_in=upd_in.dump()
                )
        except ValueError:
            # result of 'prev_api_key' decryption is a value that differs from the previously
            # encrypted key -> cryptography library raises ValueError -> apply encryption to the new value
            pass

        api_key = validate_and_encrypt_provider_api_key(api_key=upd_in.api_key)
        upd_in.api_key = api_key
        return await self.update(db=db, db_obj=provider_obj, obj_in=upd_in.dump())

    async def create_provider(
        self, db: AsyncSession, provider_in: ProviderCRUDCreate, user_model: User
    ):
        p = ModelProvider(
            name=provider_in.name,
            api_key=provider_in.api_key,
            creator_id=user_model.id,
            provider_metadata=provider_in.metadata,
        )
        db.add(p)
        await db.commit()
        await db.refresh(p)
        return p


model_config_repo = ModelConfigRepository(ModelConfig)
