import uuid
from typing import List

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.annotations import (
    created_at,
    int_pk,
    last_invoked_at,
    not_null_json_array_column,
    not_null_json_column,
    nullable_json_column,
    updated_at,
    uuid_pk,
)
from src.db.base import Base
from src.utils.enums import SenderType


class UserProjectAssociation(Base):
    __tablename__ = "user_project_associations"
    id: Mapped[int] = mapped_column(autoincrement=True, index=True, primary_key=True)

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )


class UserTeamAssociation(Base):
    __tablename__ = "user_team_associations"
    id: Mapped[int] = mapped_column(autoincrement=True, index=True, primary_key=True)

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    team_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True
    )


class AgentProjectAssociation(Base):
    __tablename__ = "agent_project_associations"
    id: Mapped[int] = mapped_column(autoincrement=True, index=True, primary_key=True)

    agent_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )


class AgentFlowProjectAssociation(Base):
    __tablename__ = "agentflow_project_associations"
    id: Mapped[int] = mapped_column(autoincrement=True, index=True, primary_key=True)

    flow_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("agentworkflows.id", ondelete="CASCADE"), nullable=False, index=True
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )


class User(Base):
    id: Mapped[uuid_pk]
    username: Mapped[str] = mapped_column(index=True, unique=True)
    password: Mapped[str]  # hash
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    agents: Mapped[List["Agent"]] = relationship(  # noqa: F821
        back_populates="creator",
    )

    workflows: Mapped[List["AgentWorkflow"]] = relationship(  # noqa: F821
        back_populates="creator",
    )

    projects: Mapped[List["Project"]] = relationship(
        secondary="user_project_associations", back_populates="users"
    )

    teams: Mapped[List["Team"]] = relationship(
        secondary="user_team_associations", back_populates="members"
    )

    logs: Mapped[List["Log"]] = relationship(
        back_populates="creator",
    )

    files: Mapped[List["File"]] = relationship(
        back_populates="creator",
    )

    model_providers: Mapped[List["ModelProvider"]] = relationship(
        back_populates="creator",
    )
    model_configs: Mapped[List["ModelConfig"]] = relationship(
        back_populates="creator",
    )

    conversations: Mapped[List["ChatConversation"]] = relationship(
        back_populates="creator"
    )
    mcpservers: Mapped[List["MCPServer"]] = relationship(back_populates="creator")
    a2acards: Mapped[List["A2ACard"]] = relationship(back_populates="creator")
    profile: Mapped["UserProfile"] = relationship(back_populates="user")

    def __repr__(self) -> str:
        return f"<User(uuid={self.id!r}, username={self.username!r})>"


class Agent(Base):
    id: Mapped[uuid_pk]

    alias: Mapped[str] = mapped_column(nullable=False, unique=True)
    name: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(nullable=False)

    jwt: Mapped[str] = mapped_column(unique=True)
    creator_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    creator: Mapped["User"] = relationship(back_populates="agents")  # noqa: F821

    input_parameters: Mapped[not_null_json_column]

    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]
    last_invoked_at: Mapped[last_invoked_at]
    is_active: Mapped[bool] = mapped_column(nullable=False)

    projects: Mapped[List["Project"]] = relationship(
        secondary="agent_project_associations", back_populates="agents"
    )


class AgentWorkflow(Base):
    id: Mapped[uuid_pk]

    alias: Mapped[str] = mapped_column(nullable=False, unique=True)
    name: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(nullable=False)

    flow: Mapped[not_null_json_array_column]

    creator_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    creator: Mapped["User"] = relationship(back_populates="workflows")  # noqa: F821

    is_active: Mapped[bool]
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    projects: Mapped[List["Project"]] = relationship(
        secondary="agentflow_project_associations", back_populates="flows"
    )


class Project(Base):
    id: Mapped[uuid_pk]

    name: Mapped[str] = mapped_column(nullable=False)

    users: Mapped[List["User"]] = relationship(
        secondary="user_project_associations", back_populates="projects"
    )

    agents: Mapped[List["Agent"]] = relationship(
        secondary="agent_project_associations", back_populates="projects"
    )

    flows: Mapped[List["AgentWorkflow"]] = relationship(
        secondary="agentflow_project_associations", back_populates="projects"
    )


class Team(Base):
    id: Mapped[uuid_pk]
    name: Mapped[str] = mapped_column(unique=True, nullable=False)

    members: Mapped[List["User"]] = relationship(
        secondary="user_team_associations", back_populates="teams"
    )


class Log(Base):
    id: Mapped[int_pk]

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), index=True, nullable=False
    )
    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), index=True, nullable=False
    )
    agent_id: Mapped[str] = mapped_column(index=True, nullable=True)
    creator_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    creator: Mapped["User"] = relationship(back_populates="logs")

    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    message: Mapped[str] = mapped_column(nullable=False)
    log_level: Mapped[str] = mapped_column(nullable=False)  # TODO: enum


class File(Base):
    id: Mapped[uuid_pk]

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), index=True, nullable=True
    )
    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), index=True, nullable=True
    )
    creator_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    creator: Mapped["User"] = relationship(back_populates="files")
    mimetype: Mapped[str]
    original_name: Mapped[str]
    internal_name: Mapped[str]
    internal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), index=True, nullable=False
    )
    from_agent: Mapped[bool]


class ModelProvider(Base):
    id: Mapped[uuid_pk]
    name: Mapped[str]
    api_key: Mapped[str] = mapped_column(nullable=True)  # encrypted in pydantic models

    provider_metadata: Mapped[not_null_json_column]
    configs: Mapped[List["ModelConfig"]] = relationship(  # noqa: F821
        back_populates="provider",
    )

    creator_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    creator: Mapped["User"] = relationship(back_populates="model_providers")
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    __table_args__ = (UniqueConstraint("creator_id", "name", name="uq_user_item_name"),)


class ModelConfig(Base):
    id: Mapped[uuid_pk]
    name: Mapped[str] = mapped_column(unique=True)
    model: Mapped[str] = mapped_column(nullable=False, index=True)

    provider_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("modelproviders.id", ondelete="CASCADE"), nullable=True, index=True
    )
    provider: Mapped["ModelProvider"] = relationship(back_populates="configs")  # noqa: F821

    system_prompt: Mapped[str]
    user_prompt: Mapped[str] = mapped_column(nullable=True)
    max_last_messages: Mapped[int] = mapped_column(default=5, nullable=False)
    temperature: Mapped[float] = mapped_column(default=0.7)

    credentials: Mapped[not_null_json_column]

    creator_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    creator: Mapped["User"] = relationship(back_populates="model_configs")

    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]


class MCPServer(Base):
    id: Mapped[uuid_pk]

    name: Mapped[str] = mapped_column(nullable=True)
    description: Mapped[str] = mapped_column(nullable=True)

    server_url: Mapped[str] = mapped_column(nullable=False)

    mcp_tools: Mapped[List["MCPTool"]] = relationship(back_populates="mcp_server")

    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    creator: Mapped["User"] = relationship(back_populates="mcpservers")  # noqa: F821

    creator_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )

    is_active: Mapped[bool]

    __table_args__ = (
        UniqueConstraint("creator_id", "server_url", name="uq_mcp_server_url"),
    )

    def __repr__(self) -> str:
        return f"<MCPServer(host={self.server_url!r}>"


class MCPTool(Base):
    id: Mapped[uuid_pk]
    name: Mapped[str]
    description: Mapped[str] = mapped_column(nullable=True)
    inputSchema: Mapped[not_null_json_column]
    annotations: Mapped[nullable_json_column]

    alias: Mapped[str] = mapped_column(nullable=True)

    mcp_server: Mapped["MCPServer"] = relationship(back_populates="mcp_tools")  # noqa: F821

    mcp_server_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("mcpservers.id", ondelete="CASCADE"), nullable=True, index=True
    )

    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]


class A2ACard(Base):
    id: Mapped[uuid_pk]

    name: Mapped[str] = mapped_column(nullable=True)
    alias: Mapped[str] = mapped_column(nullable=True)
    description: Mapped[str] = mapped_column(nullable=True)

    server_url: Mapped[str] = mapped_column(nullable=False)
    card_content: Mapped[not_null_json_column]

    is_active: Mapped[bool]

    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    creator: Mapped["User"] = relationship(back_populates="a2acards")  # noqa: F821

    creator_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    __table_args__ = (
        UniqueConstraint("creator_id", "server_url", name="uq_a2a_card_server_url"),
    )


class ChatMessage(Base):
    id: Mapped[uuid_pk]

    request_id: Mapped[uuid.UUID] = mapped_column(nullable=True)

    sender_type: Mapped[SenderType]
    content: Mapped[str]

    # 'metadata' is a reserved word by alembic
    extra_metadata: Mapped[nullable_json_column]

    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("chatconversations.session_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    conversation: Mapped["ChatConversation"] = relationship(back_populates="messages")


class ChatConversation(Base):
    """Chat history"""

    session_id: Mapped[uuid_pk] = mapped_column(nullable=False, index=True)
    title: Mapped[str]

    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    creator_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    creator: Mapped["User"] = relationship(back_populates="conversations")

    messages: Mapped[List["ChatMessage"]] = relationship(
        back_populates="conversation", cascade="all, delete"
    )


class UserProfile(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4, index=True
    )

    first_name: Mapped[str] = mapped_column(nullable=True)
    last_name: Mapped[str] = mapped_column(nullable=True)
    # TODO: other fields like address, avatar, bio, company_name, etc

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    user: Mapped["User"] = relationship(back_populates="profile", single_parent=True)

    # TODO: config fields, other credentials, etc
