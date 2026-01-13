"""Content moderation API endpoints."""

from fastapi import APIRouter, HTTPException, status
from loguru import logger

from app.models.article import (
    ModerationRequest,
    ModerationResponse,
    ErrorResponse,
)
from app.agents.moderator import moderator_agent

router = APIRouter(prefix="/moderate", tags=["moderation"])


@router.post(
    "",
    response_model=ModerationResponse,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
    summary="Moderate content",
    description="Analyze content for safety and appropriateness using AI moderation",
)
async def moderate_content(request: ModerationRequest) -> ModerationResponse:
    """
    Moderate content for safety and appropriateness.

    This endpoint analyzes content for various safety categories including:
    - Hate speech
    - Violence
    - Sexual content
    - Harassment
    - Self-harm
    - Spam
    - Misinformation

    Args:
        request: Moderation request with content and settings

    Returns:
        ModerationResponse with safety analysis and recommendations

    Raises:
        HTTPException: If moderation fails
    """
    try:
        logger.info(
            f"Moderation request: content_length={len(request.content)}, "
            f"strict_mode={request.strict_mode}"
        )

        response = await moderator_agent.moderate(request)

        logger.info(
            f"Moderation complete: is_safe={response.is_safe}, "
            f"risk_score={response.overall_risk_score:.2f}, "
            f"action={response.recommended_action}"
        )

        return response

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Moderation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to moderate content: {str(e)}",
        )
