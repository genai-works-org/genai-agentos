import time
from contextlib import asynccontextmanager
from typing import Any


@asynccontextmanager
async def trace_execution_time(trace: dict[str, Any]):
    start = time.perf_counter()
    try:
        yield
    finally:
        end = time.perf_counter()
        trace["execution_time"] = end - start
