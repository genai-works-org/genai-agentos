from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    # App settings
    ROUTER_WS_URL: str = Field(
        default="ws://genai-router:8080/ws", alias="ROUTER_WS_URL"
    )
    MASTER_AGENT_API_KEY: str = Field(
        default="e1adc3d8-fca1-40b2-b90a-7b48290f2d6a::master_server_ml",
        alias="MASTER_AGENT_API_KEY",
    )
    MASTER_BE_API_KEY: str = Field(
        default="30805518-19f3-49a6-9702-c0b0a6e87310::master_server_be",
        alias="MASTER_BE_API_KEY",
    )
    BACKEND_API_URL: str = Field(
        default="http://genai-backend:8000/api", alias="BACKEND_API_URL"
    )
