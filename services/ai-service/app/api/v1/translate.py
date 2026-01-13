"""Translation API endpoints."""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status
from loguru import logger

from app.models.article import (
    TranslateRequest,
    TranslateResponse,
    ErrorResponse,
    LanguageCode,
)
from app.services.translator import translator_service

router = APIRouter(prefix="/translate", tags=["translation"])


@router.post(
    "",
    response_model=TranslateResponse,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
    summary="Translate text",
    description="Translate text from one language to another using AI (Claude or OpenAI)",
)
async def translate_text(request: TranslateRequest) -> TranslateResponse:
    """
    Translate text using the specified AI provider.

    This endpoint supports automatic language detection and maintains formatting.
    Supports multiple languages including English, Spanish, French, German, and more.

    Args:
        request: Translation request with content and language parameters

    Returns:
        TranslateResponse with translated content and metadata

    Raises:
        HTTPException: If translation fails
    """
    try:
        logger.info(
            f"Translation request: target={request.target_language.value}, "
            f"provider={request.provider.value}, content_length={len(request.content)}"
        )

        response = await translator_service.translate(request)

        logger.info(
            f"Translation successful: {response.source_language.value} -> "
            f"{response.target_language.value}"
        )
        return response

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Translation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to translate text: {str(e)}",
        )


@router.get(
    "/languages",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="List supported languages",
    description="Get list of supported languages for translation",
)
async def list_languages() -> Dict[str, Any]:
    """
    Get list of supported languages.

    Returns:
        Dict with supported language codes and names
    """
    languages = {
        "en": "English",
        "es": "Spanish",
        "fr": "French",
        "de": "German",
        "it": "Italian",
        "pt": "Portuguese",
        "ja": "Japanese",
        "zh": "Chinese",
        "ko": "Korean",
        "ru": "Russian",
    }

    return {
        "languages": languages,
        "total": len(languages),
        "codes": list(languages.keys()),
    }


@router.post(
    "/detect",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Detect language",
    description="Detect the language of provided text",
)
async def detect_language(content: str) -> Dict[str, Any]:
    """
    Detect the language of provided text.

    Note: This is a simple implementation. In production, use a dedicated
    language detection library like langdetect or fasttext.

    Args:
        content: Text to analyze

    Returns:
        Dict with detected language code and confidence
    """
    try:
        # Simple heuristic - in production use proper language detection
        # For now, default to English
        detected_language = LanguageCode.EN
        confidence = 0.8

        logger.info(f"Language detection: {detected_language.value} (confidence: {confidence})")

        return {
            "language": detected_language.value,
            "confidence": confidence,
            "text_length": len(content),
        }

    except Exception as e:
        logger.error(f"Language detection error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to detect language: {str(e)}",
        )


@router.post(
    "/batch",
    response_model=list[TranslateResponse],
    status_code=status.HTTP_200_OK,
    summary="Batch translate",
    description="Translate multiple texts in a single request",
)
async def batch_translate(requests: list[TranslateRequest]) -> list[TranslateResponse]:
    """
    Translate multiple texts in a single request.

    Args:
        requests: List of translation requests

    Returns:
        List of translation responses

    Raises:
        HTTPException: If batch translation fails
    """
    try:
        logger.info(f"Batch translation: {len(requests)} texts")

        responses = []
        for req in requests:
            response = await translator_service.translate(req)
            responses.append(response)

        logger.info(f"Batch translation complete: {len(responses)} translations")
        return responses

    except Exception as e:
        logger.error(f"Batch translation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process batch translation: {str(e)}",
        )
