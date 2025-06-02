import httpx


async def get_agents(url: str, agent_type: str, api_key: str, user_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            headers={"X-API-KEY": api_key},
            params={"agent_type": agent_type, "user_id": user_id},
        )

        response.raise_for_status()
        agents = response.json()

    return agents["active_connections"]
