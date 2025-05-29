from typing import Optional

from pydantic import BaseModel


class AgentFilter(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
