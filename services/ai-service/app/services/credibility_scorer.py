"""
Credibility Scoring System for News Articles

This service calculates a credibility score for articles based on:
1. Cross-coverage: How many sources report similar stories
2. Source diversity: Mix of mainstream, independent, international sources
3. Fact consistency: Agreement on key facts across sources
4. Source reputation: Historical accuracy and bias of the source
5. Verification: AI-powered fact checking

Score Range: 0-100
- 90-100: Highly credible (multiple sources, facts verified)
- 70-89: Credible (covered by reputable sources)
- 50-69: Moderately credible (limited coverage or single source)
- 30-49: Low credibility (questionable source or conflicting info)
- 0-29: Unreliable (single unverified source, high bias detected)
"""

from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import numpy as np
from anthropic import Anthropic
import openai
import os
import json


@dataclass
class ArticleMetadata:
    """Article metadata for credibility analysis"""

    id: str
    title: str
    content: str
    source_name: str
    source_type: str  # 'mainstream', 'independent', 'international'
    source_bias: Optional[str]  # 'left', 'center', 'right', 'neutral'
    source_credibility: float  # Base credibility of the source (0-100)
    published_at: datetime
    category: str
    embedding: Optional[List[float]] = None


@dataclass
class CredibilityScore:
    """Credibility score result"""

    score: float  # 0-100
    confidence: float  # 0-1
    factors: Dict[str, float]
    similar_articles: List[str]  # IDs of similar articles
    source_count: int
    source_diversity: float
    fact_consistency: float
    verification_status: str
    explanation: str


class CredibilityScorer:
    """Calculate credibility scores for news articles"""

    def __init__(self):
        self.anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        openai.api_key = os.getenv("OPENAI_API_KEY")

    async def calculate_credibility(
        self, article: ArticleMetadata, all_articles: List[ArticleMetadata]
    ) -> CredibilityScore:
        """Calculate comprehensive credibility score for an article"""

        # 1. Find similar articles (cross-coverage detection)
        similar_articles = await self._find_similar_articles(article, all_articles)

        # 2. Calculate sub-scores
        cross_coverage_score = self._calculate_cross_coverage_score(similar_articles)
        source_diversity_score = self._calculate_source_diversity(
            article, similar_articles
        )
        source_reputation_score = self._calculate_source_reputation(
            article, similar_articles
        )

        # 3. Extract and compare facts (if multiple sources)
        fact_consistency_score = 0.0
        if len(similar_articles) > 0:
            fact_consistency_score = await self._check_fact_consistency(
                article, similar_articles
            )

        # 4. AI-powered verification
        verification_result = await self._ai_verification(article, similar_articles)

        # 5. Calculate weighted final score
        factors = {
            "cross_coverage": cross_coverage_score,
            "source_diversity": source_diversity_score,
            "source_reputation": source_reputation_score,
            "fact_consistency": fact_consistency_score,
            "ai_verification": verification_result["score"],
        }

        # Weights for each factor
        weights = {
            "cross_coverage": 0.30,  # 30% - How many sources
            "source_diversity": 0.20,  # 20% - Diversity of sources
            "source_reputation": 0.20,  # 20% - Source quality
            "fact_consistency": 0.15,  # 15% - Facts match across sources
            "ai_verification": 0.15,  # 15% - AI fact check
        }

        final_score = sum(factors[key] * weights[key] for key in factors)

        # Determine verification status
        if final_score >= 90:
            status = "verified"
        elif final_score >= 70:
            status = "credible"
        elif final_score >= 50:
            status = "unverified"
        else:
            status = "questionable"

        # Generate explanation
        explanation = self._generate_explanation(
            factors, len(similar_articles), status
        )

        return CredibilityScore(
            score=round(final_score, 1),
            confidence=verification_result["confidence"],
            factors=factors,
            similar_articles=[a.id for a in similar_articles],
            source_count=len(similar_articles) + 1,
            source_diversity=source_diversity_score,
            fact_consistency=fact_consistency_score,
            verification_status=status,
            explanation=explanation,
        )

    async def _find_similar_articles(
        self, article: ArticleMetadata, all_articles: List[ArticleMetadata]
    ) -> List[ArticleMetadata]:
        """Find articles covering the same story using semantic similarity"""

        # Get embedding for the article if not already computed
        if article.embedding is None:
            article.embedding = await self._get_embedding(article.title + " " + article.content[:500])

        similar = []
        similarity_threshold = 0.75  # Cosine similarity threshold

        # Time window: articles within 3 days
        time_window = timedelta(days=3)

        for other in all_articles:
            if other.id == article.id:
                continue

            # Check time window
            time_diff = abs(article.published_at - other.published_at)
            if time_diff > time_window:
                continue

            # Get embedding
            if other.embedding is None:
                other.embedding = await self._get_embedding(other.title + " " + other.content[:500])

            # Calculate cosine similarity
            similarity = self._cosine_similarity(article.embedding, other.embedding)

            if similarity >= similarity_threshold:
                similar.append(other)

        return similar

    async def _get_embedding(self, text: str) -> List[float]:
        """Get embedding vector using OpenAI"""
        try:
            response = openai.embeddings.create(
                model="text-embedding-3-small", input=text[:8000]  # Limit text length
            )
            return response.data[0].embedding
        except Exception as e:
            # Return zero vector on error
            return [0.0] * 1536

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        v1 = np.array(vec1)
        v2 = np.array(vec2)

        dot_product = np.dot(v1, v2)
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)

    def _calculate_cross_coverage_score(
        self, similar_articles: List[ArticleMetadata]
    ) -> float:
        """Calculate score based on number of sources covering the story"""

        num_sources = len(similar_articles) + 1  # +1 for the article itself

        # Score formula:
        # 1 source: 40
        # 2 sources: 60
        # 3 sources: 75
        # 4 sources: 85
        # 5+ sources: 95

        if num_sources == 1:
            return 40.0
        elif num_sources == 2:
            return 60.0
        elif num_sources == 3:
            return 75.0
        elif num_sources == 4:
            return 85.0
        else:
            return min(95.0, 85.0 + (num_sources - 4) * 2)

    def _calculate_source_diversity(
        self, article: ArticleMetadata, similar_articles: List[ArticleMetadata]
    ) -> float:
        """Calculate diversity score based on source types and biases"""

        all_sources = [article] + similar_articles

        # Count unique source types
        source_types = set(s.source_type for s in all_sources)
        type_diversity = (len(source_types) / 3) * 100  # Max 3 types

        # Count unique biases
        biases = set(s.source_bias for s in all_sources if s.source_bias)
        bias_diversity = (len(biases) / 4) * 100 if biases else 50  # Max 4 biases

        # Weighted average
        return (type_diversity * 0.6 + bias_diversity * 0.4)

    def _calculate_source_reputation(
        self, article: ArticleMetadata, similar_articles: List[ArticleMetadata]
    ) -> float:
        """Calculate average source reputation score"""

        all_sources = [article] + similar_articles

        if not all_sources:
            return 50.0

        avg_reputation = sum(s.source_credibility for s in all_sources) / len(
            all_sources
        )

        return avg_reputation

    async def _check_fact_consistency(
        self, article: ArticleMetadata, similar_articles: List[ArticleMetadata]
    ) -> float:
        """Check consistency of key facts across similar articles using AI"""

        if len(similar_articles) == 0:
            return 50.0  # Neutral score if no similar articles

        # Use Claude to extract and compare key facts
        try:
            prompt = self._build_fact_checking_prompt(article, similar_articles[:3])

            response = self.anthropic.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )

            result = json.loads(response.content[0].text)
            return float(result.get("consistency_score", 50.0))

        except Exception as e:
            return 50.0  # Default to neutral on error

    def _build_fact_checking_prompt(
        self, article: ArticleMetadata, similar_articles: List[ArticleMetadata]
    ) -> str:
        """Build prompt for AI fact consistency checking"""

        prompt = f"""Analyze the consistency of key facts across these news articles covering the same story.

Main Article:
Title: {article.title}
Source: {article.source_name}
Content: {article.content[:1000]}

Similar Articles:
"""

        for i, similar in enumerate(similar_articles, 1):
            prompt += f"""
Article {i}:
Title: {similar.title}
Source: {similar.source_name}
Content: {similar.content[:800]}
"""

        prompt += """

Extract key facts (names, dates, numbers, events) from each article and compare:
1. Are the core facts consistent across articles?
2. Are there any conflicting claims?
3. What is the consistency score?

Return JSON:
{
    "key_facts": ["fact1", "fact2", ...],
    "consistent_facts": ["fact1", ...],
    "conflicting_facts": ["fact2", ...],
    "consistency_score": 0-100,
    "explanation": "brief explanation"
}
"""

        return prompt

    async def _ai_verification(
        self, article: ArticleMetadata, similar_articles: List[ArticleMetadata]
    ) -> Dict:
        """AI-powered verification of article credibility"""

        try:
            prompt = f"""Assess the credibility of this news article.

Title: {article.title}
Source: {article.source_name} ({article.source_type})
Content: {article.content[:1500]}

Number of similar articles from other sources: {len(similar_articles)}

Evaluate:
1. Is the content factual and objective?
2. Are there signs of bias or sensationalism?
3. Does it cite sources or provide evidence?
4. Is the information verifiable?

Return JSON:
{{
    "score": 0-100,
    "confidence": 0-1,
    "flags": ["flag1", "flag2", ...],
    "strengths": ["strength1", ...],
    "explanation": "brief explanation"
}}
"""

            response = self.anthropic.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=512,
                messages=[{"role": "user", "content": prompt}],
            )

            result = json.loads(response.content[0].text)
            return {
                "score": float(result.get("score", 50.0)),
                "confidence": float(result.get("confidence", 0.5)),
                "flags": result.get("flags", []),
                "strengths": result.get("strengths", []),
            }

        except Exception as e:
            return {"score": 50.0, "confidence": 0.3, "flags": [], "strengths": []}

    def _generate_explanation(
        self, factors: Dict[str, float], num_similar: int, status: str
    ) -> str:
        """Generate human-readable explanation of the credibility score"""

        explanations = []

        if num_similar == 0:
            explanations.append("Single source - no cross-verification available")
        elif num_similar == 1:
            explanations.append("Covered by 2 sources")
        else:
            explanations.append(f"Covered by {num_similar + 1} sources")

        if factors["source_diversity"] >= 80:
            explanations.append("diverse source types")
        elif factors["source_diversity"] >= 60:
            explanations.append("moderate source diversity")
        else:
            explanations.append("limited source diversity")

        if factors["source_reputation"] >= 80:
            explanations.append("reputable sources")
        elif factors["source_reputation"] >= 60:
            explanations.append("moderately reputable sources")

        if factors["fact_consistency"] >= 80:
            explanations.append("facts consistent across sources")
        elif factors["fact_consistency"] >= 60:
            explanations.append("mostly consistent facts")
        elif num_similar > 0:
            explanations.append("some fact inconsistencies")

        return " • ".join(explanations).capitalize()


# Singleton instance
_scorer = None


def get_credibility_scorer() -> CredibilityScorer:
    """Get or create the credibility scorer instance"""
    global _scorer
    if _scorer is None:
        _scorer = CredibilityScorer()
    return _scorer
