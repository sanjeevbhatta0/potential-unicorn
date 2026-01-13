"""Translation service with Claude and OpenAI integration."""

import time
from typing import Optional
from anthropic import Anthropic, APIError, APITimeoutError, RateLimitError
from openai import OpenAI, APIError as OpenAIAPIError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)
from loguru import logger

from app.core.config import settings
from app.models.article import (
    TranslateRequest,
    TranslateResponse,
    LanguageCode,
    AIProvider,
)


class TranslatorService:
    """Service for text translation using AI models."""

    def __init__(self) -> None:
        """Initialize the translator service with API clients."""
        self.anthropic_client = Anthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None
        self.openai_client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    def _get_language_name(self, code: LanguageCode) -> str:
        """Get full language name from code."""
        language_names = {
            LanguageCode.EN: "English",
            LanguageCode.ES: "Spanish",
            LanguageCode.FR: "French",
            LanguageCode.DE: "German",
            LanguageCode.IT: "Italian",
            LanguageCode.PT: "Portuguese",
            LanguageCode.JA: "Japanese",
            LanguageCode.ZH: "Chinese",
            LanguageCode.KO: "Korean",
            LanguageCode.RU: "Russian",
        }
        return language_names.get(code, code.value.upper())

    def _build_system_prompt(self, request: TranslateRequest) -> str:
        """Build system prompt for translation."""
        target_lang = self._get_language_name(request.target_language)

        prompt = f"""You are an expert translator with deep knowledge of multiple languages and cultures.

Your task is to translate the provided text to {target_lang}.

Guidelines:
- Provide accurate and natural translations
- Maintain the meaning and tone of the original text
- Use appropriate cultural context
- Keep technical terms accurate"""

        if request.source_language:
            source_lang = self._get_language_name(request.source_language)
            prompt += f"\n- Translate from {source_lang} to {target_lang}"
        else:
            prompt += "\n- Automatically detect the source language"

        if request.preserve_formatting:
            prompt += "\n- Preserve the original formatting (line breaks, spacing, etc.)"

        prompt += "\n\nProvide ONLY the translated text without any explanations or notes."

        return prompt

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((APIError, APITimeoutError, RateLimitError)),
        before_sleep=before_sleep_log(logger, "WARNING"),
    )
    async def _translate_with_claude(self, request: TranslateRequest) -> str:
        """Translate using Claude API with retry logic."""
        if not self.anthropic_client:
            raise ValueError("Anthropic API key not configured")

        system_prompt = self._build_system_prompt(request)

        try:
            logger.info(
                f"Calling Claude API for translation to {request.target_language.value}"
            )

            response = self.anthropic_client.messages.create(
                model=settings.claude_model,
                max_tokens=settings.max_tokens,
                temperature=0.3,  # Lower temperature for more consistent translations
                system=system_prompt,
                messages=[
                    {"role": "user", "content": request.content}
                ],
            )

            translated_text = response.content[0].text.strip()
            logger.info(
                f"Claude translation complete. Tokens used: "
                f"{response.usage.input_tokens + response.usage.output_tokens}"
            )

            return translated_text

        except RateLimitError as e:
            logger.warning(f"Rate limit hit: {e}")
            raise
        except APITimeoutError as e:
            logger.warning(f"API timeout: {e}")
            raise
        except APIError as e:
            logger.error(f"Claude API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in Claude translation: {e}")
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(OpenAIAPIError),
        before_sleep=before_sleep_log(logger, "WARNING"),
    )
    async def _translate_with_openai(self, request: TranslateRequest) -> str:
        """Translate using OpenAI API with retry logic."""
        if not self.openai_client:
            raise ValueError("OpenAI API key not configured")

        system_prompt = self._build_system_prompt(request)

        try:
            logger.info(
                f"Calling OpenAI API for translation to {request.target_language.value}"
            )

            response = self.openai_client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.content},
                ],
                max_tokens=settings.max_tokens,
                temperature=0.3,  # Lower temperature for more consistent translations
            )

            translated_text = response.choices[0].message.content.strip()
            logger.info(
                f"OpenAI translation complete. Tokens used: {response.usage.total_tokens}"
            )

            return translated_text

        except OpenAIAPIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in OpenAI translation: {e}")
            raise

    def _detect_source_language(self, content: str) -> LanguageCode:
        """
        Simple heuristic to detect source language.
        In production, you'd use a proper language detection library.
        """
        # For now, default to English
        # In production, use libraries like langdetect or fasttext
        return LanguageCode.EN

    async def translate(self, request: TranslateRequest) -> TranslateResponse:
        """
        Translate text using the specified AI provider.

        Args:
            request: Translation request with content and parameters

        Returns:
            TranslateResponse with translated content and metadata

        Raises:
            ValueError: If provider is not configured
            APIError: If API call fails after retries
        """
        start_time = time.time()

        try:
            # Detect source language if not provided
            source_lang = request.source_language
            if not source_lang:
                source_lang = self._detect_source_language(request.content)
                logger.info(f"Detected source language: {source_lang.value}")

            # Perform translation
            if request.provider == AIProvider.CLAUDE:
                translated_content = await self._translate_with_claude(request)
                model_used = settings.claude_model
            elif request.provider == AIProvider.OPENAI:
                translated_content = await self._translate_with_openai(request)
                model_used = settings.openai_model
            else:
                raise ValueError(f"Unsupported provider: {request.provider}")

            processing_time = time.time() - start_time

            logger.info(
                f"Translation complete: {source_lang.value} -> {request.target_language.value} "
                f"in {processing_time:.2f}s"
            )

            return TranslateResponse(
                translated_content=translated_content,
                source_language=source_lang,
                target_language=request.target_language,
                provider=request.provider,
                model=model_used,
                confidence=None,  # Could be enhanced with confidence scoring
                processing_time=processing_time,
            )

        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Translation failed after {processing_time:.2f}s: {e}")
            raise


# Global service instance
translator_service = TranslatorService()
