import traceback
from logging import getLogger
from traceback import format_exc
from typing import Optional

from fastapi import WebSocket
from genai_session.session import GenAISession
from genai_session.utils.naming_enums import ErrorType, WSMessageType
from pydantic import ValidationError
from src.db.session import async_session
from src.repositories.agent import agent_repo
from src.repositories.flow import agentflow_repo
from src.repositories.log import log_repo
from src.repositories.user import user_repo
from src.schemas.api.agent.schemas import AgentUpdate
from src.schemas.ws.log import FrontendLogEntryDTO, LogCreate, LogEntry
from src.utils.enums import AgentType
from src.utils.helpers import FlowValidator, generate_alias
from src.utils.validate_uuid import validate_agent_or_send_err
from src.utils.validation_error_handler import validation_exception_handler
from starlette.datastructures import State

logger = getLogger(__name__)


async def message_handler_validator(
    state: State,
    session: GenAISession,
    message_type: str,
    log_message: Optional[str],
    log_level: Optional[str],
    agent_uuid: str,  # expecting jwt as uuid, TODO: change field name
    agent_description: Optional[str] = "",
    agent_input_schema: Optional[dict] = None,
    agent_name: Optional[str] = "",
    session_id: str = "",
    request_id: str = "",
    jwt_token: Optional[str] = None,
):
    # NOTE: websocket connection must be initialized by the frontend before it will be accessible here
    # if websocket is not initialized it won't dump logs to the frontend
    websocket: WebSocket = state.frontend_ws

    try:
        if message_type == WSMessageType.AGENT_REGISTER.value:
            try:
                async with async_session() as db:
                    valid_agent = await agent_repo.validate_agent_by_jwt(
                        db=db, agent_jwt=jwt_token
                    )
                    if not valid_agent:
                        logger.debug(
                            f"Agent with '{agent_uuid}' was attempted to register but either JWT is invalid or user does not exist."  # noqa: E501
                        )
                        await session.send(
                            message={
                                "error_message": "Agent ID was not registered before",
                                "error_type": ErrorType.AGENT_GENERAL_ERROR.value,
                            },
                            client_id=agent_uuid,
                            close_timeout=1,
                        )
                        return  # TODO: raise invalid agent jwt

                    old_name = "".join(valid_agent.alias.rsplit("_", 1)[:-1])
                    if agent_name == old_name:
                        alias = valid_agent.alias
                    else:
                        alias = generate_alias(agent_name)

                    agent_in = AgentUpdate(
                        id=valid_agent.id,
                        name=agent_name,
                        description=agent_description,
                        input_parameters=agent_input_schema or {},
                        is_active=True,
                        alias=alias,
                    )

                    updated_agent = await agent_repo.update(
                        db=db,
                        db_obj=valid_agent,
                        obj_in=agent_in,
                    )
                    flow_validator = FlowValidator()
                    await flow_validator.trigger_flow_validation_on_agent_state_change(
                        db=db, agent_type=AgentType.genai
                    )
                    await db.refresh(updated_agent)
                    logger.debug(f"Agent updated: {str(updated_agent.id)}")

            except ValidationError as e:
                logger.error(
                    f"Invalid agent_register event request schema. Details: {validation_exception_handler(e)}"
                )
                return
            except Exception:
                logger.error(
                    f"Error while registering agent. Details: {format_exc(limit=600)}"
                )
                return

        if message_type == WSMessageType.AGENT_UNREGISTER.value:
            try:
                agent = await validate_agent_or_send_err(agent_uuid, session=session)
                if not agent:
                    return

                async with async_session() as db:
                    user = await user_repo.get(db=db, id_=agent.creator_id)
                    if not user:
                        logger.debug(
                            f"No agent of user with id: '{agent.creator_id}' found"
                        )
                        return
                    set_inactive_flows = await agentflow_repo.set_inactive_for_all_flows_where_deleted_agent_exists(
                        db=db, agent_id=str(agent.id), user_model=user
                    )
                    if set_inactive_flows:
                        logger.debug(
                            f"Flows set as inactive: {''.join(set_inactive_flows)}"
                        )

                    inactive_agent = await agent_repo.set_agent_as_inactive(
                        db=db, id_=agent_uuid, user_id=agent.creator_id
                    )
                    if inactive_agent:
                        logger.debug(f"Set agent as inactive: {agent_uuid}")

            except ValidationError:
                logger.error(
                    f"Invalid ML request schema. Details: {validation_exception_handler()}"
                )
                return

            except Exception:
                logger.error(
                    f"Error while unregistering agent. Details: {format_exc(limit=600)}"
                )
                return

        if message_type == WSMessageType.AGENT_LOG.value:
            if session_id and request_id and log_level:
                try:
                    log_in = LogCreate(
                        session_id=session_id,
                        request_id=request_id,
                        message=log_message,
                        log_level=log_level,
                        agent_id=agent_uuid,
                    )
                    async with async_session() as db:
                        log_entry = await log_repo.create(db, obj_in=log_in)
                        logger.debug(f"Inserted log for {session_id=}, {request_id=}")
                        log_out = LogEntry(**log_entry.__dict__)

                        if websocket:
                            response = FrontendLogEntryDTO(
                                type=message_type, log=log_out
                            )
                            await websocket.send_text(response.model_dump_json())

                except Exception:
                    logger.error(f"Unexpected error occured: {traceback.format_exc()}")

                return

    except KeyError:
        msg = "KeyError: Invalid payload structure - missing 'message_type' field"  # TODO: session_id?
        logger.error(msg)
        return
