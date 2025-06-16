import pathlib
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models import File, User
from src.repositories.base import CRUDBase
from src.schemas.api.files.dto import FileDTO, FilePathDTO, ShortFileDTO
from src.schemas.api.files.schemas import FileCreate, FileUpdate
from src.utils.constants import FILES_DIR
from src.utils.enums import FileValidationOutputChoice


class FilesRepository(CRUDBase[File, FileCreate, FileUpdate]):
    async def _validate_files_exist_by_metadata(
        self, files: List[File], return_type: FileValidationOutputChoice
    ):
        """
        Gets a list of files metadata, validates which files are available from the given metadata.
        If metadata for the file exists, but file does not - file metadata is filtered out

        Args:
            db: The database session.
            file_ids: list of the uuid file_ids

        Returns:
            List of file ids objects with file metadata.
        """
        existing_files: list[Optional[File]] = []
        for file in files:
            if (FILES_DIR / file.internal_name).exists():
                existing_files.append(file)
        if return_type == FileValidationOutputChoice.file_id:
            return [file.id for file in existing_files]

        if return_type == FileValidationOutputChoice.dto:
            return [FileDTO(**file.__dict__) for file in existing_files]

        raise ValueError(
            "'return_type' must be a valid choice from 'FileValidationOutputChoice' enum object"
        )

    # TODO: filter files by user
    async def get_file_by_id(
        self, db: AsyncSession, file_id: str, user_model: User
    ) -> Optional[File]:
        q = await db.execute(
            select(self.model).where(
                and_(self.model.id == file_id, self.model.creator_id == user_model.id)
            )
        )
        file_obj = q.scalars().first()
        return file_obj

    async def get_metadata_by_id(
        self,
        db: AsyncSession,
        file_id: str,
        user_model: User,
    ) -> Optional[FileDTO]:
        file_obj = await self.get_file_by_id(
            db=db, file_id=file_id, user_model=user_model
        )
        if not file_obj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File with id {file_id} does not exist",
            )
        return FileDTO(
            id=file_obj.id,
            session_id=file_obj.session_id,
            request_id=file_obj.request_id,
            original_name=file_obj.original_name,
            mimetype=file_obj.mimetype,
            internal_id=file_obj.internal_id,
            internal_name=file_obj.internal_name,
            from_agent=file_obj.from_agent,
            creator_id=file_obj.creator_id,
        )

    async def get_file_content_by_id(
        self,
        db: AsyncSession,
        file_id: str,
        user_model: User,
    ) -> Optional[FilePathDTO]:
        file_obj = await self.get_file_by_id(
            db=db, file_id=file_id, user_model=user_model
        )
        file = pathlib.Path(FILES_DIR / file_obj.internal_name)
        if not file.exists():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Metadata of file {file_obj.internal_id} exists, but file was not found",
            )
        return FilePathDTO(
            fp=file, mime_type=file_obj.mimetype, file_name=file_obj.internal_name
        )

    async def list_files_by_request_id(
        self, db: AsyncSession, request_id: str
    ) -> Optional[List[FileDTO]]:
        """
        Retrieves a list of files metadata by 'request_id',
        validates which files are available from the given metadata.
        If metadata for the file exists, but file does not - file metadata is filtered out

        Args:
            db: The database session.
            request_id: request_id generated in the websocket endpoint on initial frontend message

        Returns:
            List of file ids objects with file metadata.
        """
        q = await db.execute(
            select(self.model).where(self.model.request_id == request_id)
        )
        files = q.scalars().all()
        return await self._validate_files_exist_by_metadata(
            files=files, return_type=FileValidationOutputChoice.dto
        )

    async def enrich_files_with_session_request_id(
        self,
        db: AsyncSession,
        file_ids: List[str],
        session_id: str,
        request_id: str,
        user_model: User,
    ) -> List[FileDTO]:
        """
        Retrieves a list of files metadata by a list of 'file_id' values,
        if file metadata is returned,
        fields 'session_id' and 'request_id' are updated in the database

        Args:
            db: The database session.
            file_ids: list of the uuid file_ids
            session_id: session_id generated in the websocket endpoint on initial frontend message
            request_id: request_id provided in frontend message

        Returns:
            List of file ids objects with file metadata.
        """
        q = await db.execute(
            select(self.model).where(
                and_(
                    self.model.id.in_(file_ids), self.model.creator_id == user_model.id
                )
            )
        )
        files = q.scalars().all()
        for file in files:
            file.request_id = request_id
            file.session_id = session_id

        await db.commit()

        updated_files = []
        for file in files:
            await db.refresh(file)
            updated_files.append(FileDTO(**file.__dict__))

        return updated_files

    async def get_files_metadata_by_user(
        self, db: AsyncSession, user_model: User, limit: int = 100, offset: int = 0
    ) -> list[Optional[FileDTO]]:
        results = await self.get_multiple_by_user(
            db=db, user_model=user_model, offset=offset, limit=limit
        )

        return [FileDTO(**file.__dict__) for file in results]

    async def get_files_by_session_id(
        self, db: AsyncSession, session_id: UUID, user_id: UUID
    ):
        files = await db.scalars(
            select(self.model).where(
                and_(
                    self.model.session_id == session_id,
                    self.model.creator_id == user_id,
                )
            )
        )
        return [
            ShortFileDTO(file_id=f.id, session_id=f.session_id, request_id=f.request_id)
            for f in files
        ]


files_repo = FilesRepository(File)
