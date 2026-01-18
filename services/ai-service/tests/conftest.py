"""
Pytest configuration and fixtures for AI Service tests.
"""

import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async HTTP client for testing."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
def sample_article():
    """Sample article data for testing."""
    return {
        "id": "test-article-123",
        "title": "Nepal's Economy Shows Strong Growth in Q4",
        "content": """
        Nepal's economy has demonstrated remarkable resilience in the fourth quarter,
        with GDP growth exceeding analyst expectations. The tourism sector has been
        a major contributor, with international arrivals reaching pre-pandemic levels.
        
        Finance Minister announced new policies to boost investment in the technology
        sector, aiming to create 50,000 new jobs in the next two years. The stock market
        responded positively to these announcements, with the NEPSE index gaining 3.5%.
        
        Agricultural exports also showed improvement, particularly in cardamom and tea,
        which remain key export commodities. The government plans to introduce new
        subsidies for farmers to increase production capacity.
        """,
        "source": "Test News Source",
        "category": "business",
        "published_at": "2026-01-18T12:00:00Z",
    }


@pytest.fixture
def sample_summarize_request(sample_article):
    """Sample summarization request."""
    return {
        "article": sample_article,
        "length": "medium",
        "provider": "claude",
    }


@pytest.fixture
def sample_translate_request():
    """Sample translation request."""
    return {
        "content": "Nepal is a beautiful country with diverse culture and traditions.",
        "target_language": "es",
        "provider": "claude",
    }


@pytest.fixture
def sample_moderate_request():
    """Sample moderation request."""
    return {
        "content": "This is a test article about politics and economy in Nepal.",
        "strict_mode": False,
    }


@pytest.fixture
def sample_credibility_request(sample_article):
    """Sample credibility scoring request."""
    return {
        "article": {
            "id": sample_article["id"],
            "title": sample_article["title"],
            "content": sample_article["content"],
            "source_name": "Test News",
            "source_type": "mainstream",
            "source_credibility": 75.0,
            "published_at": sample_article["published_at"],
            "category": sample_article["category"],
        },
        "related_articles": [],
    }
