import asyncio
import os
from typing import Annotated
from dotenv import load_dotenv
from genai_session.session import GenAISession
from genai_session.utils.context import GenAIContext

# Load environment variables
load_dotenv()

AGENT_JWT = os.getenv("AGENT_JWT")

# Initialize GenAI session
session = GenAISession(jwt_token=AGENT_JWT)

# Bind the activity agent
@session.bind(
    name="activity_agent",
    description="Suggests relaxing music and yoga routines for recovery days."
)
async def activity_agent(
    agent_context: GenAIContext,
    day_number: Annotated[int, "Recovery day number (e.g., 1 for Day 1)"]
) -> dict[str, any]:
    """Suggests music and yoga for the given recovery day."""
    agent_context.logger.info(f"[Activity Agent] Received day number: {day_number}")
    
    try:
        yoga = (
            "Neck stretches and shoulder rolls while seated"
            if day_number <= 3 else
            "Seated twists and gentle hamstring stretches"
        )
        music_link = "https://www.youtube.com/watch?v=lFcSrYw-ARY"  # Peaceful piano

        return {
            "success": True,
            "music": {
                "description": "Peaceful piano music for relaxation",
                "url": music_link
            },
            "yoga": {
                "routine": yoga,
                "note": "Stop if you feel pain or discomfort. Perform with supervision if needed."
            },
            "day": day_number
        }

    except Exception as e:
        agent_context.logger.error(f"[Activity Agent] Error: {str(e)}")
        return {
            "success": False,
            "error": "activity_suggestion_error",
            "message": str(e)
        }

# Run agent loop
async def main():
    print(f"✅ Activity agent started with token: {AGENT_JWT[:10]}...")
    await session.process_events()

if __name__ == "__main__":
    asyncio.run(main())
