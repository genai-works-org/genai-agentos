from enum import StrEnum


class Nodes(StrEnum):
    supervisor = "supervisor"
    execute_agent = "execute_agent"

print(Nodes.supervisor.value)