import logging
import shutil
import uuid
from pathlib import Path
from typing import Annotated, Optional

from fastapi import (
    APIRouter,
    File,
    Form,
    Header,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from pydantic import ValidationError
from src.auth.dependencies import CurrentUserByAgentOrUserTokenDependency
from src.core.settings import get_settings
from src.db.session import AsyncDBSession
from src.repositories.files import files_repo
from src.schemas.api.files.dto import FileDTO, FileIdDTO
from src.schemas.api.files.schemas import FileCreate
from src.utils.constants import FILES_DIR
from src.utils.helpers import get_user_id_from_jwt
from src.utils.validation_error_handler import validation_exception_handler

logger = logging.getLogger(__name__)
settings = get_settings()


files_router = APIRouter(tags=["Files"])


@files_router.get("/files/{file_id}", response_class=FileResponse)
async def get_file(
    file_id: str,
    db: AsyncDBSession,
    user: CurrentUserByAgentOrUserTokenDependency,
):
    file = await files_repo.get_file_content_by_id(
        db=db, file_id=file_id, user_model=user
    )
    return FileResponse(
        path=file.fp,
        media_type=file.mime_type or "application/octet-stream",
        filename=file.file_name,
    )


@files_router.get("/files/{file_id}/metadata", response_model=FileDTO)
async def get_file_metadata(
    file_id: uuid.UUID,
    db: AsyncDBSession,
    user: CurrentUserByAgentOrUserTokenDependency,
) -> Optional[FileDTO]:
    metadata = await files_repo.get_metadata_by_id(
        db=db, file_id=str(file_id), user_model=user
    )
    if not metadata:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File with id {file_id} does not exist",
        )

    return metadata


@files_router.post("/files", status_code=status.HTTP_201_CREATED)
async def upload_file(
    db: AsyncDBSession,
    user: CurrentUserByAgentOrUserTokenDependency,
    file: UploadFile = File(...),
    request_id: Optional[uuid.UUID] = Form(None),
    session_id: Optional[uuid.UUID] = Form(None),
) -> Optional[FileIdDTO]:
    file_id = str(uuid.uuid4())
    internal_file_name = f"{file_id}{Path(file.filename).suffix or ''}"
    file_path = Path(FILES_DIR) / internal_file_name
    # TODO: if request_id and session_id: from_agent=True
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        session_id = str(session_id) if session_id else None
        request_id = str(request_id) if request_id else None

        if request_id and session_id:
            file_in = FileCreate(
                id=file_id,
                session_id=session_id,
                request_id=request_id,
                mimetype=file.content_type,
                original_name=file.filename,
                internal_name=internal_file_name,
                internal_id=file_id,
                from_agent=True,
            )
        else:
            file_in = FileCreate(
                id=file_id,
                session_id=session_id,
                request_id=request_id,
                mimetype=file.content_type,
                original_name=file.filename,
                internal_name=internal_file_name,
                internal_id=file_id,
                from_agent=False,
            )

        new_file = await files_repo.create_by_user(
            db=db, obj_in=file_in, user_model=user
        )
        return FileIdDTO(id=str(new_file.id))

    except OSError as e:
        logger.critical(f"Failed to save file {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save file",
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=validation_exception_handler(e))


@files_router.get("/files")
async def list_all_files_by_session_id(
    db: AsyncDBSession,
    user_id: Optional[uuid.UUID] = Query(None),
    authorization: Annotated[Optional[str], Header()] = None,
    x_api_key: Annotated[Optional[str], Header(convert_underscores=True)] = None,
    session_id: uuid.UUID = Query(),
):
    if not any((user_id, authorization)):
        raise HTTPException(
            status_code=400,
            detail="You must provide either 'user_id' or your jwt token to continue.",
        )

    if all((authorization, x_api_key, user_id)):
        raise HTTPException(
            status_code=400,
            detail="You must provide either 'user_id' or your jwt token, but not both at the same time.",
        )

    if all((authorization, user_id)):
        raise HTTPException(
            status_code=400,
            detail="Lookup by user_id is not allowed for plain authenticated users.",
        )

    if not user_id and not authorization:
        if not x_api_key == settings.MASTER_BE_API_KEY:
            raise HTTPException(
                detail="You must provide x-api-key header if user_id query parameter is provided.",
                status_code=401,
            )
        user_id = get_user_id_from_jwt(token=authorization.split(" ")[-1])

    if authorization:
        user_id = get_user_id_from_jwt(token=authorization.split(" ")[-1])

    return await files_repo.get_files_by_session_id(
        db=db, session_id=session_id, user_id=user_id
    )


@files_router.get("/user/files/metadata")
async def get_files_metadata_by_user(
    db: AsyncDBSession,
    user: CurrentUserByAgentOrUserTokenDependency,
    limit: int = 100,
    offset: int = 0,
):
    files = await files_repo.get_files_metadata_by_user(
        db=db, user_model=user, limit=limit, offset=offset
    )
    return files
