import asyncio
import logging
import socket
from contextlib import asynccontextmanager
from typing import Optional

import tenacity
import uvicorn
import websockets
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from genai_session.session import GenAISession
from genai_session.utils.context import GenAIContext
from genai_session.utils.exceptions import RouterInaccessibleException
from src.core.settings import get_settings
from src.middleware.db_session import DBSessionMiddleware
from src.middleware.pagination import PaginationMiddleware
from src.middleware.provider import ProviderLookupMiddleware
from src.routes.api import api_router
from src.routes.files.routes import files_router
from src.routes.websocket import ws_router
from src.utils.jobs import run_startup_jobs
from src.utils.message_handler_validator import message_handler_validator
from src.utils.setup_logger import init_logging

init_logging()
settings = get_settings()

session = GenAISession(
    api_key=settings.MASTER_BE_API_KEY,
    ws_url=settings.ROUTER_WS_URL,
    log_level=logging.CRITICAL + 10,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI app.

    Args:
        app (FastAPI): The FastAPI application instance.

    Yields:
        None: Used to manage startup and shutdown events.
    """
    try:
        # set all agents as inactive on startup
        await run_startup_jobs()

        app.state.genai_session = session
        app.state.frontend_ws = None

        @session.bind()
        async def message_handler(
            agent_context: GenAIContext,
            message_type: str,
            agent_uuid: str,
            session_id: Optional[str] = None,
            request_id: Optional[str] = None,
            log_level: Optional[str] = None,
            log_message: Optional[str] = None,
            agent_name: Optional[str] = "",
            agent_description: Optional[str] = "",
            agent_input_schema: Optional[dict] = None,
            agent_jwt: Optional[str] = None,
        ):
            await message_handler_validator(
                session=session,
                log_message=log_message,
                log_level=log_level,
                session_id=session_id,
                request_id=request_id,
                agent_name=agent_name,
                agent_description=agent_description,
                agent_input_schema=agent_input_schema or {},
                agent_uuid=agent_uuid,
                message_type=message_type,
                state=app.state,
                jwt_token=agent_jwt,
            )

        logger.info("GenAI Session started")

        @tenacity.retry(
            retry=tenacity.retry_if_exception_type(RouterInaccessibleException),
            # 30 minutes max, exponential retry, stop retry after 30 mins
            wait=tenacity.wait_exponential(multiplier=1, min=5, max=1800),
            stop=tenacity.stop_after_delay(1800),
            reraise=True,
        )
        async def genai_event_handler():
            msg = "Cannot connect to router service. Make sure it is running and envs are configured correctly"
            try:
                await session.process_events(send_logs=False)
            except socket.gaierror:
                logger.error(
                    f"Backend failed to connect to the router websocket at '{settings.ROUTER_WS_URL}'. Please check if router is up and running."  # noqa: E501
                )
                exc = RouterInaccessibleException(msg)
                raise exc
            except RouterInaccessibleException as e:
                logger.critical(
                    f"Cannot connect to the router service at '{settings.ROUTER_WS_URL}'. Make sure it is running and envs are configured correctly"  # noqa: E501
                )
                raise e

        events_task = asyncio.create_task(genai_event_handler())
        yield

        events_task.cancel()
        await events_task

    except (asyncio.CancelledError, websockets.exceptions.ConnectionClosedError):
        pass


app = FastAPI(title="GenAI Backend", lifespan=lifespan)
app.include_router(api_router)
app.include_router(ws_router)
app.include_router(files_router)  # files router should not have the /api/ prefix


app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(PaginationMiddleware)
app.add_middleware(ProviderLookupMiddleware)
app.add_middleware(DBSessionMiddleware)


@app.route("/")
async def redirect_to_docs(request: Request):
    """
    Redirect to docs on the request to the root url of the app
    """
    return RedirectResponse("/docs")


if __name__ == "__main__":
    uvicorn.run("main:app", log_config=None, host="0.0.0.0", reload=True, port=8000)
