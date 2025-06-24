import random
import string
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from tests.schemas import (
    A2AAgentCard,
    A2AJsonSchema,
    AgentDTOPayload,
    AgentType,
    MCPToolDTO,
)


def generate_alias(agent_name: str):
    rand_alnum_str = "".join(random.choice(string.ascii_lowercase) for _ in range(6))

    return f"{agent_name}_{rand_alnum_str}"


def get_agent_description_from_skills(
    description: str, skills: list[dict[str, Any]]
) -> str:
    combined_skill_descriptions = "\n".join([skill["description"] for skill in skills])
    full_agent_description = f"{description}\nSKILLS:\n{combined_skill_descriptions}"
    return full_agent_description


def _agent_card_to_json_schema(agent_card: A2AAgentCard):
    return A2AJsonSchema(
        title=agent_card.name.strip(),
        description=get_agent_description_from_skills(
            agent_card.description,
            [s.model_dump(mode="json") for s in agent_card.skills],
        ),
    )


def a2a_agent_card_to_dto(
    id_: UUID | str,
    agent_card: A2AAgentCard,
    created_at: Optional[datetime] = None,
    updated_at: Optional[datetime] = None,
):
    json_schema = _agent_card_to_json_schema(agent_card=agent_card)
    title = json_schema.title
    return AgentDTOPayload(
        id=id_,
        name=title,
        type=AgentType.a2a,
        url=agent_card.url,
        agent_schema=json_schema.model_dump(mode="json", exclude_none=True),
        created_at=created_at,
        updated_at=updated_at,
        is_active=True,
    )


def mcp_tool_to_json_schema(
    tool: MCPToolDTO, aliased_title: Optional[str] = None
) -> dict:
    tool_dict = tool.model_dump(exclude_none=True)

    if tool_dict.get("annotations"):
        tool_dict.pop("annotations")

    tool_dict.update(tool_dict.pop("inputSchema"))
    if aliased_title:
        tool_dict.pop("name")

    tool_dict["title"] = (
        aliased_title
        if aliased_title
        else generate_alias(tool_dict.pop("name").replace(" ", "_"))
    )

    if not tool_dict.get("properties", {}):
        tool_dict["required"] = []
    return tool_dict
