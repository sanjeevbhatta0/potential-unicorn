"""Summarization service with Claude, OpenAI, and Gemini integration."""

import re
import time
from typing import List, Optional, Tuple
from anthropic import Anthropic, APIError, APITimeoutError, RateLimitError
from openai import OpenAI, APIError as OpenAIAPIError
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None
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

# Keyword mappings for category detection (supports both English and Nepali)
CATEGORY_KEYWORDS = {
    'politics': [
        'government', 'minister', 'parliament', 'election', 'vote', 'party', 'political',
        'president', 'prime minister', 'congress', 'legislation', 'policy', 'diplomat',
        'सरकार', 'मन्त्री', 'संसद', 'चुनाव', 'मतदान', 'पार्टी', 'राजनीतिक', 'प्रधानमन्त्री',
        'नेता', 'दल', 'निर्वाचन', 'राष्ट्रपति', 'कांग्रेस', 'एमाले', 'माओवादी'
    ],
    'sports': [
        'football', 'cricket', 'match', 'game', 'player', 'team', 'score', 'goal',
        'tournament', 'championship', 'league', 'athlete', 'coach', 'stadium', 'win', 'loss',
        'खेल', 'फुटबल', 'क्रिकेट', 'खेलाडी', 'टिम', 'गोल', 'प्रतियोगिता', 'च्याम्पियनशिप'
    ],
    'entertainment': [
        'movie', 'film', 'actor', 'actress', 'music', 'song', 'concert', 'celebrity',
        'bollywood', 'hollywood', 'tv', 'show', 'drama', 'series', 'singer', 'dance',
        'फिल्म', 'चलचित्र', 'गायक', 'गायिका', 'नायक', 'नायिका', 'गीत', 'संगीत', 'नाटक'
    ],
    'business': [
        'economy', 'market', 'stock', 'company', 'business', 'trade', 'investment',
        'finance', 'bank', 'price', 'profit', 'loss', 'industry', 'entrepreneur',
        'अर्थतन्त्र', 'बजार', 'व्यापार', 'कम्पनी', 'बैंक', 'लगानी', 'आर्थिक', 'मूल्य'
    ],
    'technology': [
        'technology', 'tech', 'software', 'app', 'digital', 'internet', 'computer',
        'ai', 'artificial intelligence', 'mobile', 'startup', 'innovation', 'cyber',
        'प्रविधि', 'टेक्नोलोजी', 'सफ्टवेयर', 'इन्टरनेट', 'डिजिटल', 'मोबाइल', 'एप'
    ],
    'health': [
        'health', 'hospital', 'doctor', 'medical', 'disease', 'treatment', 'patient',
        'medicine', 'vaccine', 'covid', 'virus', 'wellness', 'healthcare',
        'स्वास्थ्य', 'अस्पताल', 'डाक्टर', 'रोग', 'उपचार', 'बिरामी', 'औषधि', 'भ्याक्सिन'
    ],
    'education': [
        'education', 'school', 'university', 'college', 'student', 'teacher', 'exam',
        'learning', 'academic', 'degree', 'scholarship', 'curriculum',
        'शिक्षा', 'विद्यालय', 'विश्वविद्यालय', 'विद्यार्थी', 'शिक्षक', 'परीक्षा'
    ],
    'international': [
        'international', 'world', 'global', 'foreign', 'united nations', 'diplomacy',
        'usa', 'china', 'india', 'europe', 'america', 'asia', 'war', 'conflict',
        'अन्तर्राष्ट्रिय', 'विश्व', 'विदेश', 'भारत', 'चीन', 'अमेरिका', 'युरोप'
    ],
    'opinion': [
        'opinion', 'editorial', 'column', 'analysis', 'perspective', 'commentary',
        'view', 'thought', 'विचार', 'सम्पादकीय', 'विश्लेषण', 'टिप्पणी'
    ],
}


class SummarizerService:
    """Service for article summarization using AI models."""

    def __init__(self) -> None:
        """Initialize the summarizer service with API clients."""
        self.anthropic_client = Anthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None
        self.openai_client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self.gemini_client = None
        if GEMINI_AVAILABLE and settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.gemini_client = genai.GenerativeModel(settings.gemini_model)

    def _get_word_target(self, length: SummaryLength) -> int:
        """Get target word count based on summary length."""
        targets = {
            SummaryLength.SHORT: 100,
            SummaryLength.MEDIUM: 200,
            SummaryLength.LONG: 500,
        }
        return targets[length]

    def _detect_category_from_keywords(self, title: str, content: str) -> str:
        """Detect category based on keyword matching in title and content."""
        text = f"{title} {content}".lower()

        category_scores = {}
        for category, keywords in CATEGORY_KEYWORDS.items():
            score = sum(1 for keyword in keywords if keyword.lower() in text)
            if score > 0:
                category_scores[category] = score

        if category_scores:
            # Return category with highest score
            best_category = max(category_scores, key=category_scores.get)
            logger.info(f"Keyword-based category detection: {best_category} (score: {category_scores[best_category]})")
            return best_category

        return "general"

    def _build_system_prompt(self, request: SummarizeRequest) -> str:
        """Build system prompt for summarization."""
        word_target = self._get_word_target(request.length)

        prompt = f"""You are an expert content summarizer and classifier.
Your task is to:
1. Create a clear, concise, and accurate summary of approximately {word_target} words
2. Extract key points
3. Classify the article into exactly one of these categories: Politics, Sports, Entertainment, Business, Technology, Health, Education, International, Opinion, General

IMPORTANT: You MUST include the category classification. Choose the most specific category that fits the article content.

Guidelines:
- Maintain the main ideas and key information
- Use clear and professional language
- Preserve important facts and figures
- Keep the summary coherent and well-structured"""

        if request.key_points:
            prompt += "\n- After the summary, provide 3-5 key points as a bulleted list"

        if request.language.value != "en":
            prompt += f"\n- Write the summary and key points in {request.language.value.upper()} language, but keep the category in ENGLISH"

        prompt += """

OUTPUT FORMAT (you MUST follow this exactly):
[SUMMARY]
<your summary here>

[KEY POINTS]
- Point 1
- Point 2
- Point 3

[CATEGORY]
<single category name in English>"""

        return prompt

    def _build_user_prompt(self, request: SummarizeRequest) -> str:
        """Build user prompt with article content."""
        content = request.article.content

        if request.article.title:
            content = f"Title: {request.article.title}\n\n{content}"

        prompt = f"Please summarize and classify the following article:\n\n{content}"

        return prompt

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((APIError, APITimeoutError, RateLimitError)),
        before_sleep=before_sleep_log(logger, "WARNING"),
    )
    async def _summarize_with_claude(self, request: SummarizeRequest) -> Tuple[str, Optional[List[str]], Optional[str]]:
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

            # Parse summary, key points, and category
            summary, key_points, category = self._parse_response(
                content,
                request.key_points,
                request.article.title or "",
                request.article.content
            )

            return summary, key_points, category

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
    async def _summarize_with_openai(self, request: SummarizeRequest) -> Tuple[str, Optional[List[str]], Optional[str]]:
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

            # Parse summary, key points, and category
            summary, key_points, category = self._parse_response(
                content,
                request.key_points,
                request.article.title or "",
                request.article.content
            )

            return summary, key_points, category

        except OpenAIAPIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in OpenAI summarization: {e}")
            raise

    async def _summarize_with_gemini(self, request: SummarizeRequest) -> Tuple[str, Optional[List[str]], Optional[str]]:
        """Summarize using Gemini API."""
        if not self.gemini_client:
            raise ValueError("Gemini API key not configured or google-generativeai not installed")

        system_prompt = self._build_system_prompt(request)
        user_prompt = self._build_user_prompt(request)

        try:
            logger.info(f"Calling Gemini API with model: {settings.gemini_model}")

            # Combine prompts for Gemini (it handles system instruction differently)
            full_prompt = f"{system_prompt}\n\n{user_prompt}"

            response = self.gemini_client.generate_content(full_prompt)

            content = response.text
            logger.info(f"Gemini API response received. Content length: {len(content)}")

            # Parse summary, key points, and category
            summary, key_points, category = self._parse_response(
                content,
                request.key_points,
                request.article.title or "",
                request.article.content
            )

            return summary, key_points, category

        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise

    def _parse_response(
        self,
        content: str,
        extract_key_points: bool,
        title: str = "",
        article_content: str = ""
    ) -> Tuple[str, Optional[List[str]], Optional[str]]:
        """Parse response to extract summary, key points, and category."""
        summary = content.strip()
        key_points = None
        category = None

        valid_categories = ['politics', 'sports', 'entertainment', 'business', 'technology',
                          'health', 'education', 'international', 'opinion', 'general']

        try:
            # Extract Category - try multiple patterns
            category_patterns = [
                r'\[CATEGORY\]\s*\n?\s*(\w+)',  # [CATEGORY]\nPolitics
                r'Category:\s*(\w+)',            # Category: Politics
                r'\*\*Category\*\*:\s*(\w+)',    # **Category**: Politics
                r'category\s*[:\-]\s*(\w+)',     # category: Politics or category - Politics
            ]

            for pattern in category_patterns:
                match = re.search(pattern, content, re.IGNORECASE)
                if match:
                    extracted_category = match.group(1).strip().lower()
                    if extracted_category in valid_categories:
                        category = extracted_category
                        logger.info(f"Extracted category from AI: {category}")
                        break

            # Extract Key Points
            if "[KEY POINTS]" in content:
                parts = content.split("[KEY POINTS]")
                key_points_text = parts[1].split("[CATEGORY]")[0] if "[CATEGORY]" in parts[1] else parts[1]
                summary_part = parts[0].replace("[SUMMARY]", "").strip()

                if summary_part:
                    summary = summary_part

                # Extract bullet points
                key_points = []
                for line in key_points_text.split("\n"):
                    line = line.strip()
                    if line.startswith("-") or line.startswith("•") or line.startswith("*"):
                        point = line.lstrip("-•*").strip()
                        if point and len(point) > 5:  # Filter out empty or very short points
                            key_points.append(point)

                if not key_points:
                    key_points = None

            elif "[SUMMARY]" in content:
                # Extract just the summary part
                parts = content.split("[SUMMARY]")
                if len(parts) > 1:
                    summary_text = parts[1]
                    # Remove category section if present
                    if "[CATEGORY]" in summary_text:
                        summary_text = summary_text.split("[CATEGORY]")[0]
                    summary = summary_text.strip()

        except Exception as e:
            logger.error(f"Error parsing AI response: {e}")

        # Fallback: Use keyword-based detection if no category was extracted
        if not category or category == "general":
            keyword_category = self._detect_category_from_keywords(title, article_content)
            if keyword_category != "general":
                category = keyword_category
                logger.info(f"Using keyword-based category: {category}")
            else:
                category = "general"

        return summary, key_points, category

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
                summary, key_points, category = await self._summarize_with_claude(request)
                model_used = settings.claude_model
            elif request.provider == AIProvider.OPENAI:
                summary, key_points, category = await self._summarize_with_openai(request)
                model_used = settings.openai_model
            elif request.provider == AIProvider.GEMINI:
                summary, key_points, category = await self._summarize_with_gemini(request)
                model_used = settings.gemini_model
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
                f"({reduction_ratio:.2%} reduction) in {processing_time:.2f}s, category: {category}"
            )

            return SummarizeResponse(
                summary=summary,
                key_points=key_points,
                category=category,
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
