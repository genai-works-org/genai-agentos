from fastapi import APIRouter

from src.routes.a2a.routes import a2a_router
from src.routes.agents.routes import agent_router
from src.routes.chat.routes import chat_router
from src.routes.flows.routes import flow_router
from src.routes.llms.routes import llm_router
from src.routes.logs.routes import log_router
from src.routes.mcp.routes import mcp_router
from src.routes.user.routes import user_router

api_router = APIRouter(prefix="/api")

api_router.include_router(user_router)
api_router.include_router(agent_router)
api_router.include_router(flow_router)
api_router.include_router(log_router)
api_router.include_router(llm_router)
api_router.include_router(chat_router)
api_router.include_router(mcp_router)
api_router.include_router(a2a_router)
