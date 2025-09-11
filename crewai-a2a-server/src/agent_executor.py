from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.types import (
    InvalidParamsError,
    Part,
    Task,
    TextPart,
    UnsupportedOperationError,
)
from a2a.utils import (
    completed_task,
    new_artifact,
)
from a2a.utils.errors import ServerError
from agent import (
    LiteratureSurveillanceAgent,
    GenomicConsultationAgent,
    PathwayAnalysisAgent,
    HypothesisSynthesizerAgent,
)


class LiteratureSurveillanceAgentExecutor(AgentExecutor):
    """AgentExecutor for LiteratureSurveillanceAgent."""

    def __init__(self) -> None:
        self.agent = LiteratureSurveillanceAgent()

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        error = self._validate_request(context)
        if error:
            raise ServerError(error=InvalidParamsError())

        query = context.get_user_input()
        try:
            result = self.agent.invoke(query, context.context_id)
            print(f"Final Result ===> {result}")
        except Exception as e:
            print("Error invoking agent: %s", e)
            raise ServerError(error=ValueError(f"Error invoking agent: {e}")) from e

        parts = [
            Part(
                root=TextPart(
                    text=(
                        str(result)
                        if result
                        else "failed to generate literature synthesis"
                    )
                ),
            )
        ]
        await event_queue.enqueue_event(
            completed_task(
                context.task_id,
                context.context_id,
                [new_artifact(parts, f"literature_{context.task_id}")],
                [context.message],
            )
        )

    async def cancel(
        self, request: RequestContext, event_queue: EventQueue
    ) -> Task | None:
        raise ServerError(error=UnsupportedOperationError())

    def _validate_request(self, context: RequestContext) -> bool:
        return False


class GenomicConsultationAgentExecutor(AgentExecutor):
    """AgentExecutor for GenomicConsultationAgent."""

    def __init__(self) -> None:
        self.agent = GenomicConsultationAgent()

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        error = self._validate_request(context)
        if error:
            raise ServerError(error=InvalidParamsError())

        query = context.get_user_input()
        try:
            result = self.agent.invoke(query, context.context_id)
            print(f"Final Result ===> {result}")
        except Exception as e:
            print("Error invoking agent: %s", e)
            raise ServerError(error=ValueError(f"Error invoking agent: {e}")) from e

        parts = [
            Part(
                root=TextPart(
                    text=str(result) if result else "failed to extract genomic data"
                ),
            )
        ]
        await event_queue.enqueue_event(
            completed_task(
                context.task_id,
                context.context_id,
                [new_artifact(parts, f"genomic_{context.task_id}")],
                [context.message],
            )
        )

    async def cancel(
        self, request: RequestContext, event_queue: EventQueue
    ) -> Task | None:
        raise ServerError(error=UnsupportedOperationError())

    def _validate_request(self, context: RequestContext) -> bool:
        return False


class PathwayAnalysisAgentExecutor(AgentExecutor):
    """AgentExecutor for PathwayAnalysisAgent."""

    def __init__(self) -> None:
        self.agent = PathwayAnalysisAgent()

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        error = self._validate_request(context)
        if error:
            raise ServerError(error=InvalidParamsError())

        query = context.get_user_input()
        try:
            result = self.agent.invoke(query, context.context_id)
            print(f"Final Result ===> {result}")
        except Exception as e:
            print("Error invoking agent: %s", e)
            raise ServerError(error=ValueError(f"Error invoking agent: {e}")) from e

        parts = [
            Part(
                root=TextPart(text=str(result) if result else "failed to map pathways"),
            )
        ]
        await event_queue.enqueue_event(
            completed_task(
                context.task_id,
                context.context_id,
                [new_artifact(parts, f"pathway_{context.task_id}")],
                [context.message],
            )
        )

    async def cancel(
        self, request: RequestContext, event_queue: EventQueue
    ) -> Task | None:
        raise ServerError(error=UnsupportedOperationError())

    def _validate_request(self, context: RequestContext) -> bool:
        return False


class HypothesisSynthesizerAgentExecutor(AgentExecutor):
    """AgentExecutor for HypothesisSynthesizerAgent."""

    def __init__(self) -> None:
        self.agent = HypothesisSynthesizerAgent()

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        error = self._validate_request(context)
        if error:
            raise ServerError(error=InvalidParamsError())

        query = context.get_user_input()
        try:
            result = self.agent.invoke(query, context.context_id)
            print(f"Final Result ===> {result}")
        except Exception as e:
            print("Error invoking agent: %s", e)
            raise ServerError(error=ValueError(f"Error invoking agent: {e}")) from e

        parts = [
            Part(
                root=TextPart(
                    text=str(result) if result else "failed to generate hypotheses"
                ),
            )
        ]
        await event_queue.enqueue_event(
            completed_task(
                context.task_id,
                context.context_id,
                [new_artifact(parts, f"hypothesis_{context.task_id}")],
                [context.message],
            )
        )

    async def cancel(
        self, request: RequestContext, event_queue: EventQueue
    ) -> Task | None:
        raise ServerError(error=UnsupportedOperationError())

    def _validate_request(self, context: RequestContext) -> bool:
        return False
