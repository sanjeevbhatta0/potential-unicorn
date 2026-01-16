"""Summarization API endpoints."""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from loguru import logger

from app.models.article import (
    SummarizeRequest,
    SummarizeResponse,
    TaskResponse,
    TaskStatus,
    ErrorResponse,
)
from app.services.summarizer import summarizer_service
from app.tasks.summarize_task import process_summarization_task

router = APIRouter(prefix="/summarize", tags=["summarization"])


@router.post(
    "",
    response_model=SummarizeResponse,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
    summary="Summarize article",
    description="Synchronously summarize an article using AI (Claude or OpenAI)",
)
async def summarize_article(request: SummarizeRequest) -> SummarizeResponse:
    """
    Summarize an article using the specified AI provider.

    This endpoint processes the request synchronously and returns the summary immediately.
    For long articles or batch processing, consider using the async endpoint instead.

    Args:
        request: Summarization request with article content and parameters

    Returns:
        SummarizeResponse with summary, key points, and metadata

    Raises:
        HTTPException: If summarization fails
    """
    try:
        logger.info(
            f"Summarization request: provider={request.provider.value}, "
            f"length={request.length.value}, content_length={len(request.article.content)}"
        )

        response = await summarizer_service.summarize(request)

        logger.info(f"Summarization successful: {response.word_count} words generated")
        return response

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Summarization error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to summarize article: {str(e)}",
        )


@router.post(
    "/async",
    response_model=TaskResponse,
    status_code=status.HTTP_202_ACCEPTED,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
    summary="Summarize article asynchronously",
    description="Submit article for asynchronous summarization using Celery task queue",
)
async def summarize_article_async(
    request: SummarizeRequest,
    background_tasks: BackgroundTasks,
) -> TaskResponse:
    """
    Submit an article for asynchronous summarization.

    This endpoint queues the summarization task and returns immediately with a task ID.
    Use the task status endpoint to check progress and retrieve results.

    Args:
        request: Summarization request with article content and parameters
        background_tasks: FastAPI background tasks

    Returns:
        TaskResponse with task ID and status

    Raises:
        HTTPException: If task submission fails
    """
    try:
        logger.info(
            f"Async summarization request: provider={request.provider.value}, "
            f"content_length={len(request.article.content)}"
        )

        # Queue the task using Celery
        task = process_summarization_task.delay(request.dict())

        logger.info(f"Summarization task queued: {task.id}")

        return TaskResponse(
            task_id=task.id,
            status=TaskStatus.PENDING,
        )

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Task submission error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit summarization task: {str(e)}",
        )


@router.get(
    "/status/{task_id}",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    responses={
        404: {"model": ErrorResponse, "description": "Task not found"},
    },
    summary="Check task status",
    description="Check the status of an asynchronous summarization task",
)
async def get_task_status(task_id: str) -> Dict[str, Any]:
    """
    Check the status of an asynchronous summarization task.

    Args:
        task_id: Task ID returned from async endpoint

    Returns:
        Dict with task status and result (if completed)

    Raises:
        HTTPException: If task not found
    """
    try:
        from app.tasks.celery_app import celery_app

        result = celery_app.AsyncResult(task_id)

        response = {
            "task_id": task_id,
            "status": result.status.lower(),
            "ready": result.ready(),
        }

        if result.ready():
            if result.successful():
                response["result"] = result.result
            else:
                response["error"] = str(result.result)

        return response

    except Exception as e:
        logger.error(f"Error checking task status: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task not found: {task_id}",
        )


@router.post(
    "/batch",
    response_model=Dict[str, Any],
    status_code=status.HTTP_202_ACCEPTED,
    summary="Batch summarize articles",
    description="Submit multiple articles for batch summarization",
)
async def batch_summarize(requests: list[SummarizeRequest]) -> Dict[str, Any]:
    """
    Submit multiple articles for batch summarization.

    Args:
        requests: List of summarization requests

    Returns:
        Dict with batch task IDs

    Raises:
        HTTPException: If batch submission fails
    """
    try:
        logger.info(f"Batch summarization: {len(requests)} articles")

        task_ids = []
        for req in requests:
            task = process_summarization_task.delay(req.dict())
            task_ids.append(task.id)

        return {
            "batch_id": f"batch_{task_ids[0][:8]}",
            "task_ids": task_ids,
            "total": len(task_ids),
            "status": "pending",
        }

    except Exception as e:
        logger.error(f"Batch submission error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit batch: {str(e)}",
        )
