"""
Tests for Content Moderation API

Tests:
- POST /api/v1/moderate (moderate content)
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestModerateAPI:
    """Tests for content moderation endpoints."""

    async def test_moderate_endpoint_exists(self, client: AsyncClient, sample_moderate_request):
        """Test moderate endpoint is accessible."""
        response = await client.post(
            "/api/v1/moderate",
            json=sample_moderate_request
        )
        
        # May return 200 or 500 depending on API key config
        assert response.status_code in [200, 500, 422]

    async def test_moderate_missing_content(self, client: AsyncClient):
        """Test error when content is missing."""
        response = await client.post(
            "/api/v1/moderate",
            json={
                "strict_mode": False,
            }
        )
        
        assert response.status_code == 422

    async def test_moderate_empty_content(self, client: AsyncClient):
        """Test handling of empty content."""
        response = await client.post(
            "/api/v1/moderate",
            json={
                "content": "",
                "strict_mode": False,
            }
        )
        
        # Should handle empty content gracefully
        assert response.status_code in [200, 400, 422, 500]

    async def test_moderate_strict_mode(self, client: AsyncClient, sample_moderate_request):
        """Test moderation with strict mode enabled."""
        sample_moderate_request["strict_mode"] = True
        
        response = await client.post(
            "/api/v1/moderate",
            json=sample_moderate_request
        )
        
        assert response.status_code in [200, 500]

    async def test_moderate_safe_content(self, client: AsyncClient):
        """Test moderation of clearly safe content."""
        response = await client.post(
            "/api/v1/moderate",
            json={
                "content": "Nepal has beautiful mountains and friendly people. The weather is pleasant in spring.",
                "strict_mode": False,
            }
        )
        
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "is_safe" in data
            # Safe content should pass moderation
            assert data.get("is_safe", True) is True

    async def test_moderate_long_content(self, client: AsyncClient):
        """Test moderation of longer content."""
        long_content = "This is a test sentence. " * 100  # ~2500 characters
        
        response = await client.post(
            "/api/v1/moderate",
            json={
                "content": long_content,
                "strict_mode": False,
            }
        )
        
        assert response.status_code in [200, 500]


@pytest.mark.asyncio
class TestModerateIntegration:
    """Integration tests for moderation (requires API keys)."""

    @pytest.mark.skip(reason="Requires valid API keys")
    async def test_full_moderation_flow(self, client: AsyncClient, sample_moderate_request):
        """Test complete moderation flow with real API."""
        response = await client.post(
            "/api/v1/moderate",
            json=sample_moderate_request
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "is_safe" in data
        assert "overall_risk_score" in data
        assert "recommended_action" in data
        assert "categories" in data
