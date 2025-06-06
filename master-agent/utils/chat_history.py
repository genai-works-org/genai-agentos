import httpx
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage


def chat_history_to_messages(chat_history: list[dict[str, str]]) -> list[BaseMessage]:
    messages = []

    for msg in chat_history:
        role = msg.get("sender_type")
        content = msg.get("content")

        match role:
            case "user":
                messages.append(HumanMessage(content=content))
            case "master_agent":
                messages.append(AIMessage(content=content))
            case _:
                continue
    return messages


async def get_chat_history(url: str, session_id: str, user_id: str, api_key: str, max_last_messages: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            headers={"X-API-KEY": api_key},
            params={"session_id": session_id, "user_id": user_id, "per_page": max_last_messages}
        )

        response.raise_for_status()
        raw_chat_history = response.json()["items"]

    messages = chat_history_to_messages(chat_history=raw_chat_history[::-1])
    return messages
