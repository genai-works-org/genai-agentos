import logging

from celery import Celery
from celery.signals import after_setup_logger
from src.core.settings import get_settings

settings = get_settings()

# TODO: replace with kafka/rmq/whatever queue will be chosen
celery_app = Celery(
    "worker",
    broker=settings.REDIS_BROKER_URI,
    backend=settings.REDIS_BACKEND_URI,
    include=["src.celery.tasks"],
)

celery_app.conf.beat_schedule = {
    "run-periodic-task": {
        "task": "src.celery.tasks.singleton_mcp_a2a_lookup",
        # schedule expects seconds
        "schedule": settings.CELERY_BEAT_INTERVAL_MINUTES * 60,
    },
}
celery_app.conf.timezone = "UTC"
celery_app.autodiscover_tasks()


@after_setup_logger.connect
def setup_celery_logger(logger, *args, **kwargs):
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    logger = logging.getLogger("tasks")
    fh = logging.FileHandler("./tasks.log")
    fh.setFormatter(formatter)
    logger.addHandler(fh)
