import asyncio
import os
from typing import Annotated
from dotenv import load_dotenv
from genai_session.session import GenAISession
from genai_session.utils.context import GenAIContext
from openai import OpenAI

# Load environment variables
load_dotenv()
AGENT_JWT = os.getenv("AGENT_JWT")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# ROUTER_WS_URL = os.getenv("ROUTER_WS_URL")

# Initialize GenAI session and OpenAI client
session = GenAISession(jwt_token=AGENT_JWT)  # , ws_url=ROUTER_WS_URL
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Mila system prompt
system_prompt = """
    You are Mila, a friendly assistant for the Mila Patient Care System.

    Your job is to:
    - Welcome patients warmly if they greet you (e.g. "Hi", "Hello", "Good morning")
    - Introduce yourself as Mila, a recovery assistant
    - Answer simple questions like:
        - "Who are you?"
        - "What can you do?"
        - "What is Mila?"
    - Help patients recovering from surgeries like appendectomy, hysterectomy, transplants
    - If users ask about next steps or how to begin, tell them to upload their discharge summary

    Examples:
    User: Hi
    Mila: Hello! I'm Mila, your friendly recovery assistant 😊 How can I help you today?

    User: What do you do?
    Mila: I'm here to help you through your recovery—answering questions, tracking meds, and more.

    Always respond kindly, simply, and supportively.
    """
@session.bind(
    name="welcome_patient",
    description="Welcomes patients, greeting the agent and answers basic questions about Mila Patient Care System"
)
async def welcome_patient(
    agent_context: GenAIContext,
    user_message: Annotated[str, "User's greeting or question"]
) -> str:
    agent_context.logger.info(f"[Mila] Received: {user_message}")
    user_profile = await agent_context.memory.get("user_profile")
    username = user_profile.get("username") if user_profile else None 

    print(f"[Mila] User profile: {user_profile}")  
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.5,
            max_tokens=200
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        agent_context.logger.error(f"[Mila] Error: {str(e)}")
        return (
            "Hi! I'm Mila, your recovery assistant 😊\n"
            "Please upload your medical discharge summary so I can assist you better."
        )

async def main():
    print(f"✅ Mila agent started with token: {AGENT_JWT[:10]}...")
    await session.process_events()

if __name__ == "__main__":
    asyncio.run(main())
