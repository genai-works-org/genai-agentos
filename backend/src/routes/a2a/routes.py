import json

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from src.auth.dependencies import CurrentUserDependency
from src.db.session import AsyncDBSession
from src.repositories.a2a import a2a_repo
from src.schemas.a2a.schemas import A2ACreateAgentSchema

a2a_router = APIRouter(tags=["a2a"], prefix="/a2a")


@a2a_router.post("/url")
async def add_agent_url(
    db: AsyncDBSession,
    user_model: CurrentUserDependency,
    data_in: A2ACreateAgentSchema,
):
    try:
        return await a2a_repo.add_url(db=db, user_model=user_model, data_in=data_in)
    except ValidationError as e:
        return JSONResponse(content=json.loads(e.json()), status_code=400)
