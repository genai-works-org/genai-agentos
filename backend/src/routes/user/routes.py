from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from typing_extensions import Annotated

from src.auth.jwt import create_access_token, validate_token
from src.db.session import AsyncDBSession
from src.repositories.user import user_repo
from src.schemas.api.auth.jwt import TokenDTO
from src.schemas.api.user.schemas import TokenValidationInput, UserCreate

user_router = APIRouter(tags=["users"])


@user_router.post("/login/access-token", response_model=TokenDTO)
async def user_login(
    db: AsyncDBSession, form_data: OAuth2PasswordRequestForm = Depends()
):
    user = await user_repo.authenticate(
        db, username=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    return TokenDTO(
        access_token=create_access_token(subject=str(user.id)),
        token_type="Bearer",
    )


@user_router.post("/validate-token")
async def validate_jwt_token(db: AsyncDBSession, token_input: TokenValidationInput):
    payload = validate_token(token_input.token)
    user = await user_repo.get(db, id_=payload.sub)
    if not user:
        raise HTTPException(
            status_code=400, detail="Token is invalid or expired. Please log in again"
        )
    return JSONResponse(content={"detail": "Token is valid"}, status_code=200)


@user_router.post("/register")
async def register_user(
    db: AsyncDBSession, new_user_data: Annotated[UserCreate, Body()]
):
    try:
        return await user_repo.register(db=db, obj_in=new_user_data)
    except IntegrityError:
        raise HTTPException(
            status_code=400, detail=f"User '{new_user_data.username}' already exists"
        )
