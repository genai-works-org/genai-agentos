from src.db.session import async_session
from starlette.middleware.base import BaseHTTPMiddleware


class DBSessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        async with async_session() as db:
            request.state.db = db
            return await call_next(request)
        return await super().dispatch(request, call_next)
