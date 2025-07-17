import asyncio
from typing import Annotated

from genai_session.session import GenAISession

session = GenAISession(
    jwt_token=""
)


@session.bind(name="save_file", description="Save file to the server")
async def save_file(
        agent_context,
        content: Annotated[bytes, "File content to save"],
        file_name: Annotated[str, "Name of the file to save"]
) -> None:
    await agent_context.files.save(content=content, filename=file_name)


async def main():
    await session.process_events()


if __name__ == "__main__":
    asyncio.run(main())
