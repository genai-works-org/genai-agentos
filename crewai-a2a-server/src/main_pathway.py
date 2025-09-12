"""Entry point for the Pathway Analysis Agent A2A server."""

import logging
import os
import click
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from agent import PathwayAnalysisAgent
from agent_executor import PathwayAnalysisAgentExecutor
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MissingAPIKeyError(Exception):
    """Exception for missing API key."""


@click.command()
@click.option("--host", "host", default="localhost")
@click.option("--port", "port", default=10004)
def main(host, port):
    try:
        if not os.getenv("GOOGLE_API_KEY") and not os.getenv(
            "GOOGLE_GENAI_USE_VERTEXAI"
        ):
            raise MissingAPIKeyError(
                "GOOGLE_API_KEY or Vertex AI environment variables not set."
            )

        capabilities = AgentCapabilities(streaming=False)
        skill = AgentSkill(
            id="pathway_analysis",
            name="Pathway Analysis",
            description="Map genes to biological pathways and biomarkers using KEGG and Reactome APIs.",
            tags=["pathway", "biomarker", "mapping"],
            examples=["Map SIRT1 to biological pathways"],
        )
        agent_host_url = (
            os.getenv("HOST_OVERRIDE")
            if os.getenv("HOST_OVERRIDE")
            else f"http://{host}:{port}/"
        )
        agent_card = AgentCard(
            name="Pathway Analysis Agent",
            description="Map genes to biological pathways and identify key biomarkers for longevity research.",
            url=agent_host_url,
            version="1.0.0",
            default_input_modes=PathwayAnalysisAgent.SUPPORTED_CONTENT_TYPES,
            default_output_modes=PathwayAnalysisAgent.SUPPORTED_CONTENT_TYPES,
            capabilities=capabilities,
            skills=[skill],
        )
        request_handler = DefaultRequestHandler(
            agent_executor=PathwayAnalysisAgentExecutor(),
            task_store=InMemoryTaskStore(),
        )
        server = A2AStarletteApplication(
            agent_card=agent_card, http_handler=request_handler
        )
        import uvicorn

        uvicorn.run(server.build(), host=host, port=port)
    except MissingAPIKeyError as e:
        logger.error(f"Error: {e}")
        exit(1)
    except Exception as e:
        logger.error(f"An error occurred during server startup: {e}")
        exit(1)


if __name__ == "__main__":
    main()
