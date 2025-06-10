import uuid

URI = "ws://localhost:8080/ws"
ACTIVE_AGENTS = "http://localhost:8000/api/agents/active"

TEST_FILES_FOLDER = "/test_files"

AGENT_INPUT_SCHEMA = {
    "type": "function",
    "function": {
        "name": "",
        "description": "",
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
}

WS_HEADERS = {"x-custom-authorization": str(uuid.uuid4())}

WS_MESSAGE = {
    "message_type": "agent_invoke",
    "agent_uuid": None,
    "request_payload": {},
}

SPECIAL_CHARS = (
    "$",
    "@",
    "#",
    "%",
    "!",
    "^",
    "&",
    "*",
    "(",
    ")",
    "-",
    "_",
    "+",
    "=",
    "{",
    "}",
    "[",
    "]",
)
