from typing import Any, Generic, Optional, Type, TypeVar, Union
from uuid import UUID

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import Result, and_, delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.base import Base
from src.models import User

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        """
        CRUD object with default methods to Create, Read, Update, Delete (CRUD).

        **Parameters**

        * `model`: A SQLAlchemy model class
        * `schema`: A Pydantic model (schema) class
        """
        self.model = model

    async def get(self, db: AsyncSession, id_: Any) -> Optional[ModelType]:
        result = await db.execute(select(self.model).where(self.model.id == id_))  # type: ignore
        return result.scalars().first()

    async def get_query_by_filter(
        self, db: AsyncSession, filters: dict[str, Any], skip: int = 0, limit: int = 100
    ) -> Result:
        statement = select(self.model)  # type: ignore
        for field, value in filters.items():
            statement = statement.where(getattr(self.model, field) == value)
        statement = statement.offset(skip).limit(limit)
        return await db.execute(statement)

    async def get_by_filter(
        self,
        db: AsyncSession,
        *,
        filters: dict[str, Any],
        skip: int = 0,
        limit: int = 100,
    ) -> Optional[list[ModelType]]:
        """Get all objects by filter."""
        return (
            (await self.get_query_by_filter(db, filters, skip, limit)).scalars().all()
        )  # type: ignore

    async def get_first_by_filter(
        self, db: AsyncSession, filters: dict[str, Any]
    ) -> Optional[ModelType]:
        """Get an object by filter."""
        return (await self.get_query_by_filter(db, filters)).scalars().first()  # type: ignore

    async def get_multi(
        self, db: AsyncSession, *, offset: int = 0, limit: int = 100
    ) -> list[ModelType]:
        result = await db.execute(select(self.model).offset(offset).limit(limit))  # type: ignore
        return result.scalars().all()  # type: ignore

    async def get_last_by_filter(
        self, db: AsyncSession, filters: dict[str, Any]
    ) -> Optional[ModelType]:
        statement = select(self.model)  # type: ignore
        for field, value in filters.items():
            statement = statement.where(getattr(self.model, field) == value)
        statement = statement.order_by(self.model.created_at.desc())
        result = await db.execute(statement)
        return result.scalars().first()

    async def create(
        self, db: AsyncSession, *, obj_in: Union[CreateSchemaType, ModelType]
    ) -> ModelType | CreateSchemaType:
        db_obj = obj_in
        if isinstance(obj_in, BaseModel):
            obj_in_data = obj_in.model_dump(exclude_none=True)
            db_obj = self.model(**obj_in_data)  # type: ignore
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def multi_insert(
        self,
        *,
        db: AsyncSession,
        db_obj: list[ModelType],
    ) -> None:
        """Multiple inserts at time."""
        db.add_all(db_obj)
        await db.commit()

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, dict[str, Any]],
    ) -> ModelType:
        obj_data = db_obj.__dict__
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, *, id_: str) -> Optional[ModelType]:
        obj = await db.execute(select(self.model).where(self.model.id == id_))
        obj = obj.scalars().first()
        if not obj:
            return None
        await db.delete(obj)
        await db.commit()
        return obj

    async def update_by_user(
        self, db: AsyncSession, id_: UUID, user: User, obj_in: UpdateSchemaType
    ) -> ModelType:
        agent = await self.get_by_user(db=db, id_=str(id_), user_model=user)
        if not agent:
            return None

        obj_data = agent.__dict__
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        for field in update_data:
            if field in obj_data:
                setattr(agent, field, update_data[field])

        db.add(agent)
        await db.commit()
        await db.refresh(agent)
        return agent

    async def get_by_user(
        self, db: AsyncSession, id_: UUID, user_model: User
    ) -> Optional[ModelType]:
        q = await db.execute(
            select(self.model).where(
                and_(
                    self.model.id == str(id_),
                    self.model.creator_id == str(user_model.id),
                )
            )
        )
        return q.scalars().first()

    async def get_multiple_by_user(
        self, db: AsyncSession, *, user_model: User, offset: int = 0, limit: int = 100
    ) -> Optional[list[ModelType]]:
        q = await db.execute(
            select(self.model)
            .where(self.model.creator_id == str(user_model.id))
            .offset(offset)
            .limit(limit)
            .order_by(self.model.created_at.desc())
        )
        return q.scalars().all()

    async def get_multiple_by_user_id(
        self, db: AsyncSession, user_id: UUID | str, limit: int = 0, offset: int = 0
    ) -> list[Optional[ModelType]]:
        q = await db.scalars(
            select(self.model)
            .where(self.model.creator_id == user_id)
            .limit(limit=limit)
            .offset(offset=offset)
            .order_by(self.model.created_at.desc())
        )
        return q.all()

    async def create_by_user(
        self, db: AsyncSession, obj_in: CreateSchemaType, user_model: User
    ) -> ModelType:
        db_obj = self.model(**obj_in.model_dump(mode="json"))
        db_obj.creator_id = str(user_model.id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete_by_user(
        self,
        db: AsyncSession,
        id_: UUID,
        user: User,
    ):
        obj = await db.execute(
            select(self.model).where(
                and_(
                    self.model.creator_id == user.id,
                    self.model.id == str(id_),
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

    async def delete_multiple(self, db: AsyncSession, ids: list[str]):
        result = await db.execute(delete(self.model).where(self.model.id.in_(ids)))
        await db.commit()
        await db.flush()
        return result

    async def delete_all_from_table(self, db: AsyncSession):
        result = await db.execute(delete(self.model))
        await db.commit()
        return result

    async def update_by_id(
        self, db: AsyncSession, id_: str, obj_in: UpdateSchemaType, user_model: User
    ):
        db_obj = await self.get_by_user(db=db, id_=id_, user_model=user_model)
        if not db_obj:
            raise HTTPException(status_code=400, detail=f"Object {id_} was not found")

        return await self.update(db=db, db_obj=db_obj, obj_in=obj_in)
