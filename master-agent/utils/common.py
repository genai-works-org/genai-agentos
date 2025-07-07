import hashlib
import hmac
import json
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage
from langchain_ollama import ChatOllama


def attach_files_to_message(message: str, files: list[dict[str, Any]]):
    str_formatted_files = json.dumps(files)
    formatted_message = f"{message}\n\nFILES:\n{str_formatted_files}"
    return formatted_message


def bind_tools_safely(model: BaseChatModel, tools: list[dict[str, Any]], **kwargs):
    if isinstance(model, ChatOllama):
        return model.bind_tools(tools, **kwargs)
    return model.bind_tools(tools, parallel_tool_calls=False, **kwargs)


def filter_and_order_by_ids(ids: list[Any], items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    item_map = {item["id"]: item for item in items}
    return [item_map[i] for i in ids if i in item_map]


def remove_last_underscore_segment(s: str) -> str:
    return s.rsplit('_', 1)[0] if '_' in s else s


def generate_hmac(secret_key: str, message: str) -> str:
    return hmac.new(secret_key.encode(), message.encode(), hashlib.sha256).hexdigest()


def combine_messages(messages: list[BaseMessage]) -> str:
    return "\n".join([msg.content for msg in messages])
