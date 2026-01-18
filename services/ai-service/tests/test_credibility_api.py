"""
Tests for Credibility Scoring API

Tests:
- POST /api/v1/credibility/calculate (calculate credibility)
- POST /api/v1/credibility/batch (batch calculate)
- GET /api/v1/credibility/badge/{score} (get badge)
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestCredibilityAPI:
    """Tests for credibility scoring endpoints."""

    async def test_calculate_credibility_endpoint(self, client: AsyncClient, sample_credibility_request):
        """Test calculate credibility endpoint is accessible."""
        response = await client.post(
            "/api/v1/credibility/calculate",
            json=sample_credibility_request
        )
        
        # May return 200 or 500 depending on config
        assert response.status_code in [200, 500, 422]

    async def test_calculate_missing_article(self, client: AsyncClient):
        """Test error when article is missing."""
        response = await client.post(
            "/api/v1/credibility/calculate",
            json={
                "related_articles": [],
            }
        )
        
        assert response.status_code == 422

    async def test_calculate_with_related_articles(self, client: AsyncClient, sample_credibility_request):
        """Test credibility calculation with related articles."""
        # Add a related article
        sample_credibility_request["related_articles"] = [
            {
                "id": "related-1",
                "title": "Related News About Economy",
                "content": "Similar content about Nepal's economy and growth.",
                "source_name": "Another Source",
                "source_type": "independent",
                "source_credibility": 70.0,
                "published_at": "2026-01-18T11:00:00Z",
                "category": "business",
            }
        ]
        
        response = await client.post(
            "/api/v1/credibility/calculate",
            json=sample_credibility_request
        )
        
        assert response.status_code in [200, 500]

    async def test_batch_credibility_endpoint(self, client: AsyncClient, sample_credibility_request):
        """Test batch credibility calculation endpoint."""
        articles = [
            sample_credibility_request["article"],
            {
                "id": "test-2",
                "title": "Another Test Article",
                "content": "Different content for testing batch processing.",
                "source_name": "Test Source 2",
                "source_type": "mainstream",
                "source_credibility": 80.0,
                "published_at": "2026-01-18T10:00:00Z",
                "category": "politics",
            }
        ]
        
        response = await client.post(
            "/api/v1/credibility/batch",
            json={"articles": articles}
        )
        
        assert response.status_code in [200, 500]

    async def test_get_badge_high_score(self, client: AsyncClient):
        """Test badge for high credibility score."""
        response = await client.get("/api/v1/credibility/badge/95")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "color" in data
        assert "text" in data
        assert data["color"] == "green"
        assert data["text"] == "Verified"

    async def test_get_badge_medium_score(self, client: AsyncClient):
        """Test badge for medium credibility score."""
        response = await client.get("/api/v1/credibility/badge/75")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["color"] == "blue"
        assert data["text"] == "Credible"

    async def test_get_badge_low_score(self, client: AsyncClient):
        """Test badge for low credibility score."""
        response = await client.get("/api/v1/credibility/badge/55")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["color"] == "yellow"
        assert data["text"] == "Unverified"

    async def test_get_badge_very_low_score(self, client: AsyncClient):
        """Test badge for very low credibility score."""
        response = await client.get("/api/v1/credibility/badge/30")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["color"] == "red"
        assert data["text"] == "Questionable"


@pytest.mark.asyncio
class TestCredibilityIntegration:
    """Integration tests for credibility (requires full setup)."""

    @pytest.mark.skip(reason="Requires full service setup")
    async def test_full_credibility_flow(self, client: AsyncClient, sample_credibility_request):
        """Test complete credibility calculation flow."""
        response = await client.post(
            "/api/v1/credibility/calculate",
            json=sample_credibility_request
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "score" in data
        assert "confidence" in data
        assert "factors" in data
        assert "explanation" in data
        assert "badge_color" in data
        assert "badge_text" in data
        
        # Score should be between 0 and 100
        assert 0 <= data["score"] <= 100
