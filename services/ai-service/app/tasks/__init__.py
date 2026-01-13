"""Tasks package for Celery background processing."""

from app.tasks.celery_app import celery_app
from app.tasks.summarize_task import process_summarization_task

__all__ = ["celery_app", "process_summarization_task"]
