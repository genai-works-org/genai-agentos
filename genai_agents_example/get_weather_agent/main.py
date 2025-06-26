import asyncio
import os
from typing import Any, Annotated

import requests
from dotenv import load_dotenv
from genai_session.session import GenAISession

load_dotenv()

BASE_URL = "http://api.weatherapi.com/v1/forecast.json"
REQUEST_KEY = os.environ.get("REQUEST_KEY")

session = GenAISession(
    jwt_token=""
)


@session.bind(name="get_weather", description="Get weather forecast data")
async def get_weather(
        agent_context, city_name: Annotated[str, "City name to get weather forecast for"],
        date: Annotated[str, "Date to get forecast for in yyyy-MM-dd format"]
) -> dict[str, Any]:
    agent_context.logger.info("Inside get_translation")
    params = {"q": city_name, "dt": date, "key": REQUEST_KEY}
    response = requests.get(BASE_URL, params=params)

    return {"weather_forecast": response.json()["forecast"]["forecastday"][0]["day"]}


async def main():
    print(REQUEST_KEY)
    await session.process_events()


if __name__ == "__main__":
    asyncio.run(main())
