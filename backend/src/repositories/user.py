from typing import Any, Optional, Union
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.auth.hashing import get_password_hash, verify_password
from src.models import Project, User, UserProfile
from src.repositories.base import CRUDBase
from src.schemas.api.user.schemas import UserCreate, UserProfileCRUDUpdate, UserUpdate


class UserRepository(CRUDBase[User, UserCreate, UserUpdate]):
    async def register(self, db: AsyncSession, *, obj_in: UserCreate) -> User:
        default_project = Project(name="Default")
        db.add(default_project)
        await db.flush()

        db_obj = User(
            username=obj_in.username,
            password=get_password_hash(obj_in.password.get_secret_value()),
            projects=[default_project],
        )
        db.add(db_obj)
        await db.flush()

        profile = UserProfile(user_id=db_obj.id)
        db.add(profile)

        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: User,
        obj_in: Union[UserUpdate, dict[str, Any]],
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        if password := update_data.get("password"):
            hashed_password = get_password_hash(password)
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        return await super().update(db, db_obj=db_obj, obj_in=update_data)

    async def get_user_by_username(
        self, db: AsyncSession, *, username: str
    ) -> Optional[User]:
        res = await db.execute(select(User).where(User.username == username))  # type: ignore
        return res.scalars().first()

    async def authenticate(
        self, db: AsyncSession, *, username: str, password: str
    ) -> Optional[User]:
        user: Optional[User] = await self.get_user_by_username(db, username=username)
        if not user:
            return None
        if not verify_password(password, user.password):
            return None
        return user

    async def get_user_profile(self, db: AsyncSession, user_id: UUID):
        q = await db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))
        return q

    async def update_user_profile(
        self, db: AsyncSession, user_id: UUID, data_in: UserProfileCRUDUpdate
    ):
        user_profile = await self.get_user_profile(db=db, user_id=user_id)
        if not user_profile:
            raise HTTPException(
                status_code=400,
                detail=f"Profile with of user with id '{user_id}' was not found",
            )
        return await self.update(db=db, db_obj=user_profile, obj_in=data_in)


user_repo = UserRepository(User)
