import typing

from pydantic import BaseModel
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from src.middleware.pagination import request_object

M = typing.TypeVar("M", bound=BaseModel)


class Paginator:
    def __init__(
        self,
        session: AsyncSession,
        query: Select,
        page: int,
        per_page: int,
    ):
        self.session = session
        self.query = query
        self.page = page
        self.per_page = per_page
        self.limit = per_page * page
        self.offset = (page - 1) * per_page
        self.request = request_object.get()
        # computed later
        self.number_of_pages = 0
        self.next_page = ""
        self.previous_page = ""

    def _get_next_page(self) -> typing.Optional[str]:
        if self.page >= self.number_of_pages:
            return
        url = self.request.url.include_query_params(page=self.page + 1)
        return str(url)

    def _get_previous_page(self) -> typing.Optional[str]:
        if self.page == 1 or self.page > self.number_of_pages + 1:
            return
        url = self.request.url.include_query_params(page=self.page - 1)
        return str(url)

    async def get_response(self, cast_to: typing.Type[M]) -> dict:
        q = await self.session.scalars(self.query.limit(self.limit).offset(self.offset))
        return {
            "total_count": await self._get_total_count(),
            "next_page": self._get_next_page(),
            "previous_page": self._get_previous_page(),
            "items": [cast_to(**item.__dict__) for item in q],
        }

    def _get_number_of_pages(self, count: int) -> int:
        rest = count % self.per_page
        quotient = count // self.per_page
        return quotient if not rest else quotient + 1

    async def _get_total_count(self) -> int:
        count = await self.session.scalar(
            select(func.count()).select_from(self.query.subquery())
        )
        self.number_of_pages = self._get_number_of_pages(count)
        return count


async def paginate(
    db: AsyncSession, query: Select, cast_to: typing.Type[M], page: int, per_page: int
) -> dict:
    paginator = Paginator(db, query, page, per_page)
    return await paginator.get_response(cast_to=cast_to)
