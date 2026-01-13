"""Content moderation agent."""

import json
import time
from typing import Dict, Any
from loguru import logger

from app.agents.base_agent import BaseAgent
from app.models.article import (
    ModerationRequest,
    ModerationResponse,
    ModerationResult,
    ModerationCategory,
    AIProvider,
)


class ModeratorAgent(BaseAgent):
    """Agent for content moderation and safety checks."""

    def __init__(self, provider: AIProvider = AIProvider.CLAUDE) -> None:
        """Initialize moderator agent."""
        super().__init__(
            name="Moderator",
            provider=provider,
            temperature=0.3,  # Lower temperature for consistent moderation
            max_tokens=2048,
        )

    def get_system_prompt(self) -> str:
        """Get system prompt for content moderation."""
        return """You are a content moderation expert. Your task is to analyze content for safety and appropriateness.

Analyze the provided content for the following categories:
1. hate_speech: Hateful, discriminatory, or prejudiced content
2. violence: Violent, graphic, or threatening content
3. sexual_content: Sexually explicit or inappropriate content
4. harassment: Bullying, harassment, or personal attacks
5. self_harm: Content promoting self-harm or suicide
6. spam: Spam, scams, or misleading content
7. misinformation: False or misleading information

For each category, provide:
- flagged: true/false
- confidence: 0.0 to 1.0 (how confident you are)
- explanation: Brief explanation if flagged

Respond in JSON format:
{
    "categories": {
        "hate_speech": {"flagged": false, "confidence": 0.95, "explanation": ""},
        "violence": {"flagged": false, "confidence": 0.98, "explanation": ""},
        "sexual_content": {"flagged": false, "confidence": 0.99, "explanation": ""},
        "harassment": {"flagged": false, "confidence": 0.97, "explanation": ""},
        "self_harm": {"flagged": false, "confidence": 0.99, "explanation": ""},
        "spam": {"flagged": false, "confidence": 0.90, "explanation": ""},
        "misinformation": {"flagged": false, "confidence": 0.85, "explanation": ""}
    },
    "overall_risk_score": 0.0,
    "recommended_action": "allow"
}

Be thorough but fair. Only flag content that clearly violates policies."""

    def _parse_moderation_response(self, response: str, strict_mode: bool) -> Dict[str, Any]:
        """Parse moderation response from AI."""
        try:
            # Try to parse JSON from response
            # Clean up response if it has markdown code blocks
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()

            data = json.loads(response)
            return data

        except json.JSONDecodeError:
            logger.warning("Failed to parse moderation response as JSON, using fallback")
            # Fallback: assume safe if we can't parse
            return {
                "categories": {
                    cat.value: {"flagged": False, "confidence": 0.5, "explanation": ""}
                    for cat in ModerationCategory
                    if cat != ModerationCategory.SAFE
                },
                "overall_risk_score": 0.0,
                "recommended_action": "review",
            }

    def _calculate_overall_risk(self, categories: Dict[str, Dict[str, Any]]) -> float:
        """Calculate overall risk score from category results."""
        total_risk = 0.0
        count = 0

        for category_data in categories.values():
            if category_data["flagged"]:
                total_risk += category_data["confidence"]
            count += 1

        return total_risk / count if count > 0 else 0.0

    def _determine_action(self, risk_score: float, strict_mode: bool) -> str:
        """Determine recommended action based on risk score."""
        if strict_mode:
            if risk_score > 0.3:
                return "block"
            elif risk_score > 0.1:
                return "review"
            else:
                return "allow"
        else:
            if risk_score > 0.5:
                return "block"
            elif risk_score > 0.2:
                return "review"
            else:
                return "allow"

    async def moderate(self, request: ModerationRequest) -> ModerationResponse:
        """
        Moderate content for safety and appropriateness.

        Args:
            request: Moderation request with content and settings

        Returns:
            ModerationResponse with safety analysis
        """
        start_time = time.time()

        logger.info(f"Moderating content (strict_mode={request.strict_mode})")

        # Build context
        context = {
            "strict_mode": request.strict_mode,
            "content_length": len(request.content),
        }

        # Execute moderation
        response_text = await self.execute(
            user_message=f"Analyze this content:\n\n{request.content}",
            context=context,
        )

        # Parse response
        parsed_data = self._parse_moderation_response(response_text, request.strict_mode)

        # Build results
        results = []
        for category_name, category_data in parsed_data.get("categories", {}).items():
            try:
                category = ModerationCategory(category_name)
                results.append(
                    ModerationResult(
                        category=category,
                        flagged=category_data["flagged"],
                        confidence=category_data["confidence"],
                        explanation=category_data.get("explanation") or None,
                    )
                )
            except ValueError:
                logger.warning(f"Unknown moderation category: {category_name}")

        # Calculate metrics
        overall_risk = self._calculate_overall_risk(parsed_data.get("categories", {}))
        is_safe = overall_risk < (0.3 if request.strict_mode else 0.5)
        recommended_action = self._determine_action(overall_risk, request.strict_mode)

        processing_time = time.time() - start_time

        logger.info(
            f"Moderation complete: risk_score={overall_risk:.2f}, "
            f"action={recommended_action}, time={processing_time:.2f}s"
        )

        return ModerationResponse(
            is_safe=is_safe,
            results=results,
            overall_risk_score=overall_risk,
            recommended_action=recommended_action,
            provider=self.provider,
            processing_time=processing_time,
        )


# Global moderator instance
moderator_agent = ModeratorAgent()
