import asyncio
from datetime import datetime

from genai_session.session import GenAISession

session = GenAISession(
    jwt_token=""
)


@session.bind(name="get_current_date", description="Return current date")
async def get_current_date(agent_context):
    agent_context.logger.info("Inside get_current_date")
    return datetime.now().strftime("%Y-%m-%d")


async def main():
    await session.process_events()


if __name__ == "__main__":
    asyncio.run(main())
