"""Celery task for asynchronous article summarization."""

import asyncio
from typing import Dict, Any
from celery import Task
from loguru import logger

from app.tasks.celery_app import celery_app
from app.models.article import SummarizeRequest
from app.services.summarizer import summarizer_service


class SummarizationTask(Task):
    """Custom task class for summarization with retry logic."""

    autoretry_for = (Exception,)
    retry_kwargs = {"max_retries": 3}
    retry_backoff = True
    retry_backoff_max = 600  # 10 minutes
    retry_jitter = True


@celery_app.task(
    bind=True,
    base=SummarizationTask,
    name="app.tasks.summarize_task.process_summarization_task",
    queue="summarization",
)
def process_summarization_task(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process article summarization task asynchronously.

    This task is executed by Celery workers and can be monitored via task ID.
    Includes automatic retry logic for transient failures.

    Args:
        self: Celery task instance
        request_data: Serialized SummarizeRequest data

    Returns:
        Dict with summarization results

    Raises:
        Exception: If summarization fails after retries
    """
    task_id = self.request.id
    logger.info(f"Starting summarization task: {task_id}")

    try:
        # Update task state
        self.update_state(
            state="PROCESSING",
            meta={
                "status": "processing",
                "progress": 0,
            },
        )

        # Parse request
        request = SummarizeRequest(**request_data)

        logger.info(
            f"Task {task_id}: Summarizing with provider={request.provider.value}, "
            f"length={request.length.value}"
        )

        # Run async summarization in event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response = loop.run_until_complete(summarizer_service.summarize(request))
        finally:
            loop.close()

        # Update progress
        self.update_state(
            state="PROCESSING",
            meta={
                "status": "finalizing",
                "progress": 90,
            },
        )

        result = {
            "task_id": task_id,
            "status": "completed",
            "summary": response.summary,
            "key_points": response.key_points,
            "word_count": response.word_count,
            "original_length": response.original_length,
            "reduction_ratio": response.reduction_ratio,
            "provider": response.provider.value,
            "model": response.model,
            "processing_time": response.processing_time,
            "created_at": response.created_at.isoformat(),
        }

        logger.info(
            f"Task {task_id} completed: {response.word_count} words generated "
            f"in {response.processing_time:.2f}s"
        )

        return result

    except Exception as e:
        logger.error(f"Task {task_id} failed: {e}")

        # Update task state with error
        self.update_state(
            state="FAILURE",
            meta={
                "status": "failed",
                "error": str(e),
                "task_id": task_id,
            },
        )

        # Re-raise to trigger retry
        raise


@celery_app.task(
    bind=True,
    name="app.tasks.summarize_task.batch_summarization_task",
    queue="summarization",
)
def batch_summarization_task(self, requests_data: list[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Process batch summarization task.

    Args:
        self: Celery task instance
        requests_data: List of serialized SummarizeRequest data

    Returns:
        Dict with batch results
    """
    task_id = self.request.id
    logger.info(f"Starting batch summarization task: {task_id} ({len(requests_data)} articles)")

    results = []
    failed = []

    for idx, request_data in enumerate(requests_data):
        try:
            # Update progress
            progress = int((idx / len(requests_data)) * 100)
            self.update_state(
                state="PROCESSING",
                meta={
                    "status": "processing",
                    "progress": progress,
                    "current": idx + 1,
                    "total": len(requests_data),
                },
            )

            # Process individual request
            result = process_summarization_task(request_data)
            results.append(result)

        except Exception as e:
            logger.error(f"Batch item {idx} failed: {e}")
            failed.append({"index": idx, "error": str(e)})

    logger.info(
        f"Batch task {task_id} completed: {len(results)} succeeded, {len(failed)} failed"
    )

    return {
        "task_id": task_id,
        "status": "completed",
        "total": len(requests_data),
        "succeeded": len(results),
        "failed": len(failed),
        "results": results,
        "errors": failed,
    }
