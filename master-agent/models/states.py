import operator
from typing import Annotated, Any

from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages
from pydantic import BaseModel


class MasterAgentState(BaseModel):
    messages: Annotated[list[BaseMessage], add_messages]
    trace: Annotated[list[dict[str, Any]], operator.add]
