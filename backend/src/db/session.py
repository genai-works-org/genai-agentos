from typing import Annotated, AsyncGenerator

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from src.core.settings import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.SQLALCHEMY_ASYNC_DATABASE_URI,
    poolclass=NullPool,
    future=True,
    # echo=settings.DEBUG,
    pool_pre_ping=True,
)
async_session = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)


async def get_db() -> AsyncGenerator:
    async with async_session() as session:
        yield session


def get_middleware_db(request: Request) -> AsyncSession:
    return request.state.db


AsyncDBSession = Annotated[AsyncSession, Depends(get_db)]
