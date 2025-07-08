from contextvars import ContextVar

from sqlalchemy import and_, select
from src.auth.jwt import TokenLifespanType, validate_token
from src.core.settings import get_settings
from src.db.session import async_session
from src.models import ModelProvider
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

settings = get_settings()
request_object: ContextVar[Request] = ContextVar("request")


async def lookup_provider_per_current_user(request: Request, call_next):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        response = await call_next(request)
        return response

    token = validate_token(
        token=auth_header.rsplit(" ")[-1], lifespan_type=TokenLifespanType.api
    )
    if not token:
        return await call_next(request)

    user_id = token.sub

    async with async_session() as db:
        existing_provider = await db.scalar(
            select(ModelProvider).where(
                and_(ModelProvider.name == "genai", ModelProvider.creator_id == user_id)
            )
        )
        if not existing_provider:
            new_provider = ModelProvider(
                name="genai",
                provider_metadata={"base_url": settings.GENAI_PROVIDER_URL},
                creator_id=user_id,
            )
            db.add(new_provider)
            await db.commit()
            return await call_next(request)

    return await call_next(request)


class ProviderLookupMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        return await lookup_provider_per_current_user(
            request=request, call_next=call_next
        )
