"""Summarization service with Claude and OpenAI integration."""

import time
from typing import List, Optional, Tuple
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
    SummarizeRequest,
    SummarizeResponse,
    SummaryLength,
    AIProvider,
)


class SummarizerService:
    """Service for article summarization using AI models."""

    def __init__(self) -> None:
        """Initialize the summarizer service with API clients."""
        self.anthropic_client = Anthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None
        self.openai_client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    def _get_word_target(self, length: SummaryLength) -> int:
        """Get target word count based on summary length."""
        targets = {
            SummaryLength.SHORT: 100,
            SummaryLength.MEDIUM: 200,
            SummaryLength.LONG: 500,
        }
        return targets[length]

    def _build_system_prompt(self, request: SummarizeRequest) -> str:
        """Build system prompt for summarization."""
        word_target = self._get_word_target(request.length)

        prompt = f"""You are an expert content summarizer. Your task is to create clear, concise, and accurate summaries.

Guidelines:
- Create a summary of approximately {word_target} words
- Maintain the main ideas and key information
- Use clear and professional language
- Preserve important facts and figures
- Keep the summary coherent and well-structured"""

        if request.key_points:
            prompt += "\n- After the summary, provide 3-5 key points as a bulleted list"

        if request.language.value != "en":
            prompt += f"\n- Write the summary in {request.language.value.upper()} language"

        return prompt

    def _build_user_prompt(self, request: SummarizeRequest) -> str:
        """Build user prompt with article content."""
        content = request.article.content

        if request.article.title:
            content = f"Title: {request.article.title}\n\n{content}"

        prompt = f"Please summarize the following article:\n\n{content}"

        if request.key_points:
            prompt += "\n\nProvide the summary followed by key points in this format:\n[SUMMARY]\n<summary text>\n\n[KEY POINTS]\n- Point 1\n- Point 2\n- Point 3"

        return prompt

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((APIError, APITimeoutError, RateLimitError)),
        before_sleep=before_sleep_log(logger, "WARNING"),
    )
    async def _summarize_with_claude(self, request: SummarizeRequest) -> Tuple[str, Optional[List[str]]]:
        """Summarize using Claude API with retry logic."""
        if not self.anthropic_client:
            raise ValueError("Anthropic API key not configured")

        system_prompt = self._build_system_prompt(request)
        user_prompt = self._build_user_prompt(request)

        try:
            logger.info(f"Calling Claude API with model: {settings.claude_model}")

            response = self.anthropic_client.messages.create(
                model=settings.claude_model,
                max_tokens=settings.max_tokens,
                temperature=settings.temperature,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ],
            )

            content = response.content[0].text
            logger.info(f"Claude API response received. Tokens used: {response.usage.input_tokens + response.usage.output_tokens}")

            # Parse summary and key points
            summary, key_points = self._parse_response(content, request.key_points)

            return summary, key_points

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
            logger.error(f"Unexpected error in Claude summarization: {e}")
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(OpenAIAPIError),
        before_sleep=before_sleep_log(logger, "WARNING"),
    )
    async def _summarize_with_openai(self, request: SummarizeRequest) -> Tuple[str, Optional[List[str]]]:
        """Summarize using OpenAI API with retry logic."""
        if not self.openai_client:
            raise ValueError("OpenAI API key not configured")

        system_prompt = self._build_system_prompt(request)
        user_prompt = self._build_user_prompt(request)

        try:
            logger.info(f"Calling OpenAI API with model: {settings.openai_model}")

            response = self.openai_client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=settings.max_tokens,
                temperature=settings.temperature,
            )

            content = response.choices[0].message.content
            logger.info(f"OpenAI API response received. Tokens used: {response.usage.total_tokens}")

            # Parse summary and key points
            summary, key_points = self._parse_response(content, request.key_points)

            return summary, key_points

        except OpenAIAPIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in OpenAI summarization: {e}")
            raise

    def _parse_response(self, content: str, extract_key_points: bool) -> Tuple[str, Optional[List[str]]]:
        """Parse response to extract summary and key points."""
        if not extract_key_points:
            return content.strip(), None

        # Try to split by markers
        if "[SUMMARY]" in content and "[KEY POINTS]" in content:
            parts = content.split("[KEY POINTS]")
            summary = parts[0].replace("[SUMMARY]", "").strip()
            key_points_text = parts[1].strip()

            # Extract bullet points
            key_points = []
            for line in key_points_text.split("\n"):
                line = line.strip()
                if line.startswith("-") or line.startswith("•"):
                    key_points.append(line.lstrip("-•").strip())

            return summary, key_points if key_points else None

        # If no markers, return full content as summary
        return content.strip(), None

    async def summarize(self, request: SummarizeRequest) -> SummarizeResponse:
        """
        Summarize an article using the specified AI provider.

        Args:
            request: Summarization request with article and parameters

        Returns:
            SummarizeResponse with summary, key points, and metadata

        Raises:
            ValueError: If provider is not configured
            APIError: If API call fails after retries
        """
        start_time = time.time()

        try:
            # Get summary and key points
            if request.provider == AIProvider.CLAUDE:
                summary, key_points = await self._summarize_with_claude(request)
                model_used = settings.claude_model
            elif request.provider == AIProvider.OPENAI:
                summary, key_points = await self._summarize_with_openai(request)
                model_used = settings.openai_model
            else:
                raise ValueError(f"Unsupported provider: {request.provider}")

            # Calculate metrics
            original_length = len(request.article.content)
            summary_word_count = len(summary.split())
            original_word_count = len(request.article.content.split())
            reduction_ratio = 1 - (summary_word_count / original_word_count) if original_word_count > 0 else 0
            processing_time = time.time() - start_time

            logger.info(
                f"Summarization complete: {original_word_count} -> {summary_word_count} words "
                f"({reduction_ratio:.2%} reduction) in {processing_time:.2f}s"
            )

            return SummarizeResponse(
                summary=summary,
                key_points=key_points,
                word_count=summary_word_count,
                original_length=original_length,
                reduction_ratio=reduction_ratio,
                provider=request.provider,
                model=model_used,
                processing_time=processing_time,
            )

        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Summarization failed after {processing_time:.2f}s: {e}")
            raise


# Global service instance
summarizer_service = SummarizerService()
