import copy
import logging
import traceback
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from genai_session.session import AgentResponse, GenAISession
from genai_session.utils.naming_enums import MasterServerName
from pydantic import ValidationError

from src.core.settings import get_settings
from src.db.session import AsyncDBSession
from src.repositories.chat import chat_repo
from src.repositories.files import files_repo
from src.repositories.model_config import model_config_repo
from src.schemas.api.agent.dto import AgentResponseWithFilesDTO, AgentTypeResponseDTO
from src.schemas.api.chat.schemas import CreateChatMessage
from src.schemas.ws.frontend import (
    AgentResponseDTO,
    IncomingFrontendMessage,
    LLMPropertiesDecryptCreds,
)
from src.schemas.ws.ml import OutgoingMLRequestSchema
from src.utils.enums import SenderType
from src.utils.validate_uuid import is_valid_uuid
from src.utils.validation_error_handler import validation_exception_handler
from src.utils.websocket import get_current_ws_user

settings = get_settings()
logger = logging.getLogger(__name__)

ws_router = APIRouter()


@ws_router.websocket("/frontend/ws")
async def handle_frontend_ws(
    websocket: WebSocket,
    db: AsyncDBSession,
):
    """
        WS endpoint to receive messages from frontend and proxy them to ML

        Expected frontend message schema:
        ```
        {
            "message": "Return current date and convert in to human readable time in EU format",
            "llm_name": "some"
            "llm": {
                "config_name": "some",
                "credentials": {

                },
            },
            "files": [
                "55704c5d-2d9b-4e5a-9d01-c6816cac5aa2"
            ]
        }
        ```

        Example of message structure for master agent:
        ```
        {
        "message": "Flip a coin and return the result",
        "agents": [...],
        "configs": {
            "llm": {
                "provider": "openai",
                "model": "gpt-4o-mini",
                "temperature": 0.7,
                "system_prompt": "...",
                "config_name": "wasda",
                "endpoint": "some", # optional (required for azure openai)
                "api_key": "sk-", # optional, encrypted (required for azure openai/openai api), but decrypted for the master agent message  # noqa: E501
                "api_version": "v1", # optional (required for azure openai)
                "deployment_name": "some", # optional (required for azure openai)
                "base_url": "http://localhostdasdas" # optional (required for ollama)
            }
        },
        "files": [...]
    }

        ```


        Expected response to frontend response schema:
        ```
        {
            "is_success": true,
            "execution_time": 4.310033996000129,
            "response": {
                "agents_trace": [...],
                "response" "The current date is ...",
                "is_success": true,
            },
            "files": [
                {  # optional
                    "id": "55704c5d-2d9b-4e5a-9d01-c6816cac5aa2",
                    "session_id": "f24f3b3a-54b4-4cd3-a398-dc475b6b2ab4",
                    "request_id": "49d7aaaf-a173-4a9f-a84c-29dbb5f8b50e",
                    "original_name": "photo_2025-02-21_19-57-18.jpg",
                    "mimetype": "image/jpeg",
                    "internal_id": "55704c5d-2d9b-4e5a-9d01-c6816cac5aa2",
                    "internal_name": "55704c5d-2d9b-4e5a-9d01-c6816cac5aa2.jpg",
                    "from_agent": false
                },
                ...
            ]
        }
        ```
    """
    query_params = websocket.query_params
    token = query_params.get("token")
    if not token:
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="JWT token is expired or invalid",
        )
        return

    current_user = await get_current_ws_user(websocket=websocket, db=db, token=token)
    # user_model is being initialized on websocket connection, on every WS message sqlalchemy will attempt to access the attribute of a model in an already closed connection, hence raising the exception  # noqa: E501
    user_model = copy.deepcopy(current_user)
    if not user_model:
        return

    session_id = query_params.get("session_id")
    if not session_id:
        # if session_id was not provided
        session_id = str(uuid4())
    else:
        if not is_valid_uuid(uuid=session_id):
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="session_id is not a valid UUID",
            )
            return

    websocket.app.state.frontend_ws = websocket
    await websocket.accept()

    session: GenAISession = websocket.app.state.genai_session

    try:
        while True:
            try:
                message_obj = IncomingFrontendMessage.model_validate_json(
                    await websocket.receive_text()
                )
            except ValidationError as e:
                await websocket.send_text(
                    f"Message validation failed. Details: {validation_exception_handler(exc=e)}"  # noqa: E501
                )
            chat_title = message_obj.message[:20]
            if not chat_title:
                chat_title = "New Chat"

            chat = await chat_repo.get_chat_by_session_id(
                db=db, session_id=session_id, user_model=user_model
            )
            if not chat:
                await chat_repo.create_chat_by_session_id(
                    db=db,
                    user_model=user_model,
                    session_id=session_id,
                    initial_user_message=chat_title,
                )

            request_id = str(uuid4())
            file_ids = message_obj.files
            if file_ids:
                files = await files_repo.enrich_files_with_session_request_id(
                    db=db,
                    file_ids=file_ids,
                    session_id=session_id,
                    request_id=request_id,
                    user_model=user_model,
                )
            else:
                files = []

            provider = await model_config_repo.get_provider_by_name(
                db=db, provider_name=message_obj.provider, user_id=user_model.id
            )
            config = await model_config_repo.find_model_by_config_name(
                db=db, config_name=message_obj.llm_name, user_model=user_model
            )
            if not provider:
                await websocket.send_json(
                    {"error": f"Provider {message_obj.provider} does not exist"}
                )
                await websocket.close(
                    code=status.WS_1003_UNSUPPORTED_DATA,
                    reason=f"Provider {message_obj.provider} does not exist",
                )

            if not config:
                await websocket.send_json(
                    {"error": f"Config {message_obj.llm_name} does not exist"}
                )
                await websocket.close(
                    code=status.WS_1003_UNSUPPORTED_DATA,
                    reason=f"Config {message_obj.llm_name} does not exist",
                )
            try:
                enriched_llm_props = LLMPropertiesDecryptCreds(
                    config_name=config.name,
                    provider=provider.name,
                    model=config.model,
                    temperature=config.temperature,
                    system_prompt=config.system_prompt,
                    user_prompt=config.user_prompt,
                    credentials={
                        **config.credentials,
                        **provider.provider_metadata,
                        "api_key": provider.api_key,
                    },
                    max_last_messages=config.max_last_messages,
                )
            except ValueError:
                await websocket.send_json(
                    {
                        "error": "Could not decrypt api_key. Make sure 'api_key' exists and model config was created beforehand "  # noqa: E501
                    }
                )
                return

            await chat_repo.add_message_to_conversation(
                db=db,
                user_model=user_model,
                session_id=session_id,
                request_id=request_id,
                message_in=CreateChatMessage(
                    sender_type=SenderType.user, content=message_obj.message
                ),
            )

            ml_request = OutgoingMLRequestSchema(
                user_id=user_model.id,
                session_id=session_id,
                timestamp=int(datetime.now().timestamp()),
                configs=enriched_llm_props.to_json(),
                files=files,
            )
            req_body = ml_request.model_dump(exclude_none=True)

            try:
                session.request_id = request_id
                session.session_id = session_id
                response: AgentResponse = await session.send(
                    client_id=MasterServerName.MASTER_SERVER_ML.value,
                    message=req_body,
                )
                agent_response = AgentResponseDTO(
                    execution_time=response.execution_time,
                    response=response.response,
                    request_id=request_id,
                    session_id=session_id,
                )
                await chat_repo.add_message_to_conversation(
                    db=db,
                    user_model=user_model,
                    session_id=session_id,
                    request_id=request_id,
                    message_in=CreateChatMessage(
                        sender_type=SenderType.master_agent,
                        content=agent_response.response,
                    ),
                )

                files_by_request_id = await files_repo.list_files_by_request_id(
                    db=db, request_id=request_id
                )
                response_with_files = AgentResponseWithFilesDTO(
                    **agent_response.model_dump(mode="json"),
                    files=files_by_request_id,
                )

                response_structure = AgentTypeResponseDTO(
                    type="agent_response", response=response_with_files
                )
                await websocket.send_text(response_structure.model_dump_json())
            except ConnectionRefusedError:
                logger.critical(
                    f"Cannot connect to the router service at '{settings.ROUTER_WS_URL}'. Make sure it is running and envs are configured correctly"  # noqa: E501
                )
                await websocket.send_json(
                    {"error": "Cannot connect to router service. Try again later"}
                )
                await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
                raise ConnectionRefusedError(
                    "Cannot connect to router service. Make sure it is running and envs are configured correctly"
                )
            except Exception:
                logger.error(f"Unexpected error occured: {traceback.format_exc()}")
                await websocket.send_json(
                    {"error": "Unexpected error occured. Try again later"}
                )
                await websocket.close(code=status.WS_1011_INTERNAL_ERROR)

    except ValidationError as e:
        logger.debug(traceback.format_exc())
        await websocket.send_text(
            f"Message validation failed. Details: {validation_exception_handler(exc=e)}"  # TODO: returned message on exc is not informative # noqa: E501
        )
    except ValueError as e:
        await websocket.send_text(
            f"Message validation failed. Incorrect value was provided. Details: {str(e)}"
        )

    except WebSocketDisconnect:
        logger.warning("Frontend client disconnected")

    except Exception:
        logger.error(
            f"Unexpected error occured. Traceback: {traceback.format_exc(limit=600)}"
        )
