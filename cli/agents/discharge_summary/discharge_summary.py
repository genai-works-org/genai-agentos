import os
import asyncio
from typing import Annotated, Optional, Any
from dotenv import load_dotenv
from openai import OpenAI
from genai_session.session import GenAISession
from genai_session.utils.context import GenAIContext

# Load environment variables
load_dotenv()
AGENT_JWT = os.getenv("AGENT_JWT")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize GenAI session and OpenAI client
genai_session = GenAISession(jwt_token=AGENT_JWT)
openai_client = OpenAI(api_key=OPENAI_API_KEY)


@genai_session.bind(
    name="mila_agent",
    description="Mila - Your friendly post-surgery care assistant that responds to greetings and extracts recovery plans"
)
async def mila_agent(
    agent_context: GenAIContext,
    user_message: Annotated[str, "The user's input message (e.g. greeting or question)"],
    discharge_summary: Annotated[Optional[str], "Patient's discharge summary text"] = None
) -> dict[str, Any]:
    """
    Mila agent:
    - Greets the user and introduces herself
    - Answers simple recovery questions
    - If a discharge summary is present, extracts a structured recovery plan (meds, appointments, activity, diet)
    - If no summary and user asks about recovery, politely requests the summary
    """
    agent_context.logger.info(f"[Mila] Received: {user_message}")

    if discharge_summary:
        # Prompt for structured extraction
        system_prompt = f"""
You are Mila, a medical data extraction assistant for the Mila Patient Care System.

When a discharge summary is provided, extract and convert it into a structured recovery plan with the following fields:

1. medicines: list of medication schedules with the following structure:
   - date
   - time
   - type (breakfast, lunch, dinner, sos)
   - medicine_name
   - dosage

2. appointments: list of appointments/tests with:
   - date
   - time
   - type (lab/doctor)
   - test_name or purpose

3. activity: recovery-related activities to be tracked:
   - date
   - time
   - activity_name
   - duration (if available)
   - doctor_schedule (if any)

4. diet: if no diet plan is mentioned, leave empty or say "Not specified"

Return the final result in this exact JSON format:
{{
  "medicines": [...],
  "appointments": [...],
  "activity": [...],
  "diet": [...]
}}

Discharge Summary:
{discharge_summary}
"""
    else:
        # Friendly conversational assistant without summary
        system_prompt = """
You are Mila, a friendly and professional assistant for the Mila Patient Care System.

Your job is to:
- Welcome users warmly if they say "hi", "hello", etc.
- Introduce yourself as Mila, a recovery assistant
- Help patients recovering from surgeries
- Answer basic questions like "Who are you?", "What can you do?", "What should I do next?"

If the user asks about recovery instructions or medication but has not uploaded a discharge summary, politely ask for it.

Keep responses short, caring, and helpful.
"""

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            max_tokens=800,
            temperature=0.4
        )

        mila_response = response.choices[0].message.content.strip()

        return {
            "response": mila_response,
            "user_message": user_message,
            "agent_type": "mila_agent",
            "has_discharge_summary": bool(discharge_summary)
        }

    except Exception as e:
        agent_context.logger.error(f"[Mila] Error: {str(e)}")

        fallback_response = (
            "Hi! I'm Mila, your post-surgery care assistant. 🏥\n"
            "Please upload your discharge summary so I can help you better with medications, appointments, or diet tips."
        )

        return {
            "response": fallback_response,
            "user_message": user_message,
            "agent_type": "mila_agent",
            "error": str(e),
            "has_discharge_summary": bool(discharge_summary)
        }


async def main():
    print(f"✅ Mila agent started with token: {AGENT_JWT[:10]}...")
    await genai_session.process_events()

if __name__ == "__main__":
    asyncio.run(main())
