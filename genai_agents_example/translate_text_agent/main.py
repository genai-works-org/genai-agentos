import asyncio
import os
from typing import Any, Annotated

from dotenv import load_dotenv
from genai_session.session import GenAISession
from openai import OpenAI

load_dotenv()

OPENAPI_KEY = os.environ.get("OPENAPI_KEY")

openai_client = OpenAI(
    api_key=OPENAPI_KEY
)

session = GenAISession(
    jwt_token=""
)


@session.bind(name="get_translation", description="Translate the text into specified language")
async def get_translation(
        agent_context, text: Annotated[str, "Text to translate"],
        language: Annotated[str, "Code of the language to translate to (e.g. 'fr', 'es')"]
) -> dict[str, Any]:
    agent_context.logger.info("Inside get_translation")
    prompt = f"Translate the text into specified language {language}.\n\n{text}"

    response = openai_client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        model="gpt-4o-mini"
    )
    translation = response.choices[0].message.content
    return {"translation": translation}


async def main():
    await session.process_events()


if __name__ == "__main__":
    asyncio.run(main())
