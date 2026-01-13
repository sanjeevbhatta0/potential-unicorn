"""Celery application configuration."""

from celery import Celery
from loguru import logger

from app.core.config import settings

# Create Celery app
celery_app = Celery(
    "ai_service",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks.summarize_task"],
)

# Celery configuration
celery_app.conf.update(
    # Task routing
    task_routes={
        "app.tasks.summarize_task.*": {"queue": "summarization"},
        "app.tasks.*": {"queue": "default"},
    },
    # Task serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    # Timezone
    timezone="UTC",
    enable_utc=True,
    # Result backend
    result_expires=3600,  # Results expire after 1 hour
    result_backend_transport_options={
        "master_name": "mymaster",
    },
    # Task execution
    task_acks_late=True,  # Acknowledge after task completion
    task_reject_on_worker_lost=True,
    task_track_started=True,
    # Worker
    worker_prefetch_multiplier=1,  # Only fetch one task at a time
    worker_max_tasks_per_child=100,  # Restart worker after 100 tasks
    # Monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,
    # Rate limiting
    task_default_rate_limit="100/m",  # 100 tasks per minute
    # Error handling
    task_soft_time_limit=300,  # 5 minutes soft limit
    task_time_limit=360,  # 6 minutes hard limit
)

# Configure logging
logger.info("Celery app initialized")


@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """Setup periodic tasks."""
    # Example: Add periodic cleanup task
    # sender.add_periodic_task(
    #     3600.0,  # Every hour
    #     cleanup_old_results.s(),
    #     name="cleanup old results"
    # )
    pass


@celery_app.task(bind=True)
def debug_task(self):
    """Debug task for testing."""
    logger.info(f"Request: {self.request!r}")
    return {"status": "success", "message": "Debug task executed"}
