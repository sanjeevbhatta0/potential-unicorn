"""
Credibility Scoring API Endpoints
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from app.services.credibility_scorer import (
    CredibilityScorer,
    ArticleMetadata,
    CredibilityScore,
    get_credibility_scorer,
)

router = APIRouter(prefix="/credibility", tags=["Credibility Scoring"])


# Request/Response Models
class ArticleInput(BaseModel):
    """Input article for credibility scoring"""

    id: str
    title: str
    content: str
    source_name: str
    source_type: str = Field(..., description="mainstream, independent, international")
    source_bias: Optional[str] = Field(
        None, description="left, center, right, neutral"
    )
    source_credibility: float = Field(
        ..., ge=0, le=100, description="Base source credibility (0-100)"
    )
    published_at: datetime
    category: str


class CalculateCredibilityRequest(BaseModel):
    """Request to calculate credibility for an article"""

    article: ArticleInput
    related_articles: List[ArticleInput] = Field(
        default=[],
        description="Other recent articles to compare against for cross-verification",
    )


class CredibilityScoreResponse(BaseModel):
    """Credibility score response"""

    article_id: str
    score: float
    confidence: float
    factors: dict
    similar_articles: List[str]
    source_count: int
    source_diversity: float
    fact_consistency: float
    verification_status: str
    explanation: str
    badge_color: str
    badge_text: str


class BatchScoreRequest(BaseModel):
    """Batch scoring request"""

    articles: List[ArticleInput]


class BatchScoreResponse(BaseModel):
    """Batch scoring response"""

    scores: List[CredibilityScoreResponse]
    processed: int
    failed: int


# API Endpoints


@router.post("/calculate", response_model=CredibilityScoreResponse)
async def calculate_credibility(request: CalculateCredibilityRequest):
    """
    Calculate credibility score for a single article

    The credibility score is based on:
    - Cross-coverage: How many sources report similar stories
    - Source diversity: Mix of mainstream, independent, international sources
    - Fact consistency: Agreement on key facts across sources
    - Source reputation: Historical accuracy of the source
    - AI verification: AI-powered fact checking
    """

    try:
        scorer = get_credibility_scorer()

        # Convert to internal format
        article = ArticleMetadata(
            id=request.article.id,
            title=request.article.title,
            content=request.article.content,
            source_name=request.article.source_name,
            source_type=request.article.source_type,
            source_bias=request.article.source_bias,
            source_credibility=request.article.source_credibility,
            published_at=request.article.published_at,
            category=request.article.category,
        )

        related = [
            ArticleMetadata(
                id=a.id,
                title=a.title,
                content=a.content,
                source_name=a.source_name,
                source_type=a.source_type,
                source_bias=a.source_bias,
                source_credibility=a.source_credibility,
                published_at=a.published_at,
                category=a.category,
            )
            for a in request.related_articles
        ]

        # Calculate score
        result = await scorer.calculate_credibility(article, related)

        # Determine badge
        badge = _get_badge(result.score)

        return CredibilityScoreResponse(
            article_id=request.article.id,
            score=result.score,
            confidence=result.confidence,
            factors=result.factors,
            similar_articles=result.similar_articles,
            source_count=result.source_count,
            source_diversity=result.source_diversity,
            fact_consistency=result.fact_consistency,
            verification_status=result.verification_status,
            explanation=result.explanation,
            badge_color=badge["color"],
            badge_text=badge["text"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch", response_model=BatchScoreResponse)
async def batch_calculate_credibility(
    request: BatchScoreRequest, background_tasks: BackgroundTasks
):
    """
    Calculate credibility scores for multiple articles in batch

    This is useful for scoring all articles in a database.
    Articles are compared against each other for cross-verification.
    """

    try:
        scorer = get_credibility_scorer()

        # Convert all articles
        articles = [
            ArticleMetadata(
                id=a.id,
                title=a.title,
                content=a.content,
                source_name=a.source_name,
                source_type=a.source_type,
                source_bias=a.source_bias,
                source_credibility=a.source_credibility,
                published_at=a.published_at,
                category=a.category,
            )
            for a in request.articles
        ]

        scores = []
        failed = 0

        for article in articles:
            try:
                # Compare against all other articles
                other_articles = [a for a in articles if a.id != article.id]

                result = await scorer.calculate_credibility(article, other_articles)

                badge = _get_badge(result.score)

                scores.append(
                    CredibilityScoreResponse(
                        article_id=article.id,
                        score=result.score,
                        confidence=result.confidence,
                        factors=result.factors,
                        similar_articles=result.similar_articles,
                        source_count=result.source_count,
                        source_diversity=result.source_diversity,
                        fact_consistency=result.fact_consistency,
                        verification_status=result.verification_status,
                        explanation=result.explanation,
                        badge_color=badge["color"],
                        badge_text=badge["text"],
                    )
                )

            except Exception as e:
                failed += 1
                continue

        return BatchScoreResponse(
            scores=scores, processed=len(scores), failed=failed
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/badge/{score}", response_model=dict)
async def get_badge(score: float):
    """
    Get badge information for a credibility score

    Returns color and text for displaying a credibility badge
    """

    return _get_badge(score)


def _get_badge(score: float) -> dict:
    """Determine badge color and text based on score"""

    if score >= 90:
        return {
            "color": "green",
            "text": "Verified",
            "icon": "✓",
            "description": "Highly credible - verified by multiple sources",
        }
    elif score >= 70:
        return {
            "color": "blue",
            "text": "Credible",
            "icon": "✓",
            "description": "Credible - covered by reputable sources",
        }
    elif score >= 50:
        return {
            "color": "yellow",
            "text": "Unverified",
            "icon": "!",
            "description": "Unverified - limited cross-verification",
        }
    else:
        return {
            "color": "red",
            "text": "Questionable",
            "icon": "⚠",
            "description": "Questionable - verify before sharing",
        }
