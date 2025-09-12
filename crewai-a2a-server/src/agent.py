"""
Crew AI-based sample for A2A protocol.

This module defines agent classes for literature surveillance, genomic consultation,
pathway analysis, and hypothesis synthesis. Each agent is designed to perform specific
biomedical data tasks using CrewAI and integrates with external tools and APIs.
"""

import os
import logging

from crewai import LLM, Agent, Crew, Task
from crewai.process import Process
from dotenv import load_dotenv
from tools import (
    kegg_tool,
    reactome_tool,
    pubmed_tool,
    arxiv_tool,
    google_scholar_tool,
)


load_dotenv()
logger = logging.getLogger(__name__)


class LiteratureSurveillanceAgent:
    """
    Agent for scientific literature search and synthesis.

    This agent searches PubMed, arXiv, and Google Scholar for relevant articles
    based on a user query, then synthesizes and summarizes the findings.
    """

    SUPPORTED_CONTENT_TYPES = ["text", "text/plain"]

    def __init__(self):
        """
        Initialize the LiteratureSurveillanceAgent with the appropriate LLM model.
        The model is selected based on environment variables for Google VertexAI or Gemini,
        otherwise defaults to GPT-4o.
        """
        if os.getenv("GOOGLE_GENAI_USE_VERTEXAI"):
            self.model = LLM(model="vertex_ai/gemini-2.0-flash")
        elif os.getenv("GOOGLE_API_KEY"):
            self.model = LLM(
                model="gemini/gemini-2.0-flash",
                api_key=os.getenv("GOOGLE_API_KEY"),
            )
        else:
            self.model = LLM(model="gpt-4o")
        self.literature_agent = Agent(
            role="Literature Surveillance Expert",
            goal="Search and synthesize scientific articles from PubMed, arXiv, and Google Scholar.",
            backstory="You are a biomedical research assistant specializing in literature review. You efficiently find, summarize, and synthesize relevant scientific articles for longevity research.",
            verbose=False,
            allow_delegation=False,
            tools=[pubmed_tool, arxiv_tool, google_scholar_tool],
            llm=self.model,
        )
        self.literature_task = Task(
            description=(
                "Given a query '{user_query}', search PubMed, arXiv, and Google Scholar for relevant articles. "
                "Summarize key findings, provide a concise synthesis, and ALWAYS include the full citation for each relevant article found."
            ),
            expected_output=(
                "A synthesized summary of relevant articles, each accompanied by its full scientific citation. "
                "Citations must include authors, title, journal/conference, year, and DOI or URL."
            ),
            agent=self.literature_agent,
        )
        self.crew = Crew(
            agents=[self.literature_agent],
            tasks=[self.literature_task],
            process=Process.sequential,
            verbose=False,
        )

    def invoke(self, query, session_id):
        """
        Run the literature surveillance agent with the given query and session ID.

        Args:
            query (str): The user query for literature search.
            session_id (str): The session identifier.

        Returns:
            str: Synthesized summary of relevant articles.
        """
        inputs = {"user_query": query, "session_id": session_id}
        return self.crew.kickoff(inputs)

    async def stream(self, query: str):
        """
        Streaming is not supported for this agent.
        """
        raise NotImplementedError("Streaming is not supported by CrewAI.")


class GenomicConsultationAgent:
    """
    Agent for genomic and regulatory data extraction.

    This agent extracts genomic and regulatory data from longevity-genie MCP servers
    such as opengenes-mcp and synergy-age-mcp, based on user queries.
    """

    SUPPORTED_CONTENT_TYPES = ["text", "text/plain"]

    def __init__(self):
        """
        Initialize the GenomicConsultationAgent with the appropriate LLM model.
        """
        if os.getenv("GOOGLE_GENAI_USE_VERTEXAI"):
            self.model = LLM(model="vertex_ai/gemini-2.0-flash")
        elif os.getenv("GOOGLE_API_KEY"):
            self.model = LLM(
                model="gemini/gemini-2.0-flash",
                api_key=os.getenv("GOOGLE_API_KEY"),
            )
        else:
            self.model = LLM(model="gpt-4o")
        self.genomic_agent = Agent(
            role="Genomic Data Consultant",
            goal="Extract genomic and regulatory data from longevity-genie MCP servers (opengenes-mcp, synergy-age-mcp).",
            backstory="You are a genomics expert with access to specialized longevity databases. You retrieve and interpret genomic and regulatory information for research purposes.",
            verbose=False,
            allow_delegation=False,
            tools=[],  # Integrate MCP server tools here
            llm=self.model,
        )
        self.genomic_task = Task(
            description="Given a gene or regulatory query '{user_query}', extract relevant data from opengenes-mcp and synergy-age-mcp servers.",
            expected_output="Extracted genomic/regulatory data.",
            agent=self.genomic_agent,
        )
        self.crew = Crew(
            agents=[self.genomic_agent],
            tasks=[self.genomic_task],
            process=Process.sequential,
            verbose=False,
        )

    def invoke(self, query, session_id):
        """
        Run the genomic consultation agent with the given query and session ID.

        Args:
            query (str): The user query for genomic data extraction.
            session_id (str): The session identifier.

        Returns:
            str: Extracted genomic/regulatory data.
        """
        inputs = {"user_query": query, "session_id": session_id}
        return self.crew.kickoff(inputs)

    async def stream(self, query: str):
        """
        Streaming is not supported for this agent.
        """
        raise NotImplementedError("Streaming is not supported by CrewAI.")


class PathwayAnalysisAgent:
    """
    Agent for mapping genes to biological pathways and biomarkers.

    This agent maps a list of genes to biological pathways and biomarkers using
    KEGG and Reactome APIs.
    """

    SUPPORTED_CONTENT_TYPES = ["text", "text/plain"]

    def __init__(self):
        """
        Initialize the PathwayAnalysisAgent with the appropriate LLM model.
        """
        if os.getenv("GOOGLE_GENAI_USE_VERTEXAI"):
            self.model = LLM(model="vertex_ai/gemini-2.0-flash")
        elif os.getenv("GOOGLE_API_KEY"):
            self.model = LLM(
                model="gemini/gemini-2.0-flash",
                api_key=os.getenv("GOOGLE_API_KEY"),
            )
        else:
            self.model = LLM(model="gpt-4o")
        self.pathway_agent = Agent(
            role="Pathway Analysis Specialist",
            goal="Map genes to biological pathways and biomarkers using KEGG and Reactome APIs.",
            backstory="You are a systems biology expert who specializes in mapping genes to biological pathways and identifying key biomarkers using pathway databases.",
            verbose=False,
            allow_delegation=False,
            tools=[kegg_tool, reactome_tool],
            llm=self.model,
        )
        self.pathway_task = Task(
            description="Given a list of genes '{user_query}', map them to biological pathways and biomarkers using KEGG and Reactome APIs.",
            expected_output="Mapped pathways and biomarkers.",
            agent=self.pathway_agent,
        )
        self.crew = Crew(
            agents=[self.pathway_agent],
            tasks=[self.pathway_task],
            process=Process.sequential,
            verbose=False,
        )

    def invoke(self, query, session_id):
        """
        Run the pathway analysis agent with the given query and session ID.

        Args:
            query (str): The user query containing a list of genes.
            session_id (str): The session identifier.

        Returns:
            str: Mapped pathways and biomarkers.
        """
        inputs = {"user_query": query, "session_id": session_id}
        return self.crew.kickoff(inputs)

    async def stream(self, query: str):
        """
        Streaming is not supported for this agent.
        """
        raise NotImplementedError("Streaming is not supported by CrewAI.")


class HypothesisSynthesizerAgent:
    """
    Orchestrator agent for generating research hypotheses from integrated artifacts.

    This is the highest-level agent in the system. It does not interact directly with external tools or APIs.
    Instead, it coordinates the other agents to collect and pre-process the necessary information to address a complex research question.
    Once it has gathered the artifacts from the other agents, it uses an internal Large Language Model (LLM) to reason over the integrated information and generate new, plausible, and verifiable research hypotheses.
    """

    SUPPORTED_CONTENT_TYPES = ["text", "text/plain"]

    def __init__(self):
        """
        Initialize the HypothesisSynthesizerAgent with the appropriate LLM model.
        This agent does not use external tools. It expects to receive artifacts from other agents.
        """
        if os.getenv("GOOGLE_GENAI_USE_VERTEXAI"):
            self.model = LLM(model="vertex_ai/gemini-2.0-flash")
        elif os.getenv("GOOGLE_API_KEY"):
            self.model = LLM(
                model="gemini/gemini-2.0-flash",
                api_key=os.getenv("GOOGLE_API_KEY"),
            )
        else:
            self.model = LLM(model="gpt-4o")
        self.orchestrator_agent = Agent(
            role="Research Hypothesis Orchestrator",
            goal=(
                "Coordinate other agents to collect and pre-process information needed to address complex research questions. "
                "Integrate artifacts from literature, genomic, and pathway analysis agents, and use an internal LLM to reason over the combined data. "
                "Generate new, plausible, and verifiable research hypotheses."
            ),
            backstory=(
                "You are the top-level orchestrator agent in a biomedical research system. "
                "You do not interact directly with external tools or APIs. "
                "Your role is to gather and integrate artifacts produced by specialized agents, and use advanced reasoning to synthesize new research hypotheses. "
                "Your output should be plausible, verifiable, and grounded in the integrated evidence provided by the other agents."
            ),
            verbose=False,
            allow_delegation=False,
            tools=[],  # No external tools
            llm=self.model,
        )
        self.orchestrator_task = Task(
            description=(
                "Given a set of integrated artifacts from literature, genomic, and pathway analysis agents (provided as '{artifacts}'), "
                "use advanced reasoning to generate new, plausible, and verifiable research hypotheses. "
                "Do not interact with external tools; only use the provided artifacts and your internal LLM capabilities. "
                "Output should be a set of hypotheses, each clearly stated and supported by the integrated evidence."
            ),
            expected_output=(
                "A set of well-formed, plausible, and verifiable research hypotheses, each supported by the integrated artifacts."
            ),
            agent=self.orchestrator_agent,
        )
        self.crew = Crew(
            agents=[self.orchestrator_agent],
            tasks=[self.orchestrator_task],
            process=Process.sequential,
            verbose=False,
        )

    def invoke(self, artifacts, session_id):
        """
        Run the orchestrator agent with the given artifacts and session ID.

        Args:
            artifacts (dict): Integrated artifacts from other agents (literature, genomic, pathway, etc.).
            session_id (str): The session identifier.

        Returns:
            str: Well-formed, plausible, and verifiable research hypotheses supported by the integrated artifacts.
        """
        inputs = {"artifacts": artifacts, "session_id": session_id}
        return self.crew.kickoff(inputs)

    async def stream(self, artifacts: dict):
        """
        Streaming is not supported for this agent.
        """
        raise NotImplementedError("Streaming is not supported by CrewAI.")
