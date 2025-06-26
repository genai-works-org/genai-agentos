# !pip install genai-protocol

from datetime import datetime

import nest_asyncio
from genai_session.session import GenAISession

nest_asyncio.apply()


session = GenAISession(
    jwt_token="",
    ws_url="wss:// router ngrok url /ws" # Ngrok will give you as URL like https://12345678.ngrok.io/ change it to wss://12345678.ngrok.io/ws
)


@session.bind(name="get_current_date", description="Agent returns current date")
async def get_current_date(agent_context):
    return datetime.now().strftime("%Y-%m-%d")


async def main():
    await session.process_events()


await main()
