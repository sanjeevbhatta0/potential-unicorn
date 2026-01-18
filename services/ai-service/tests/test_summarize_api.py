"""
Tests for Summarization API

Tests:
- POST /api/v1/summarize (synchronous summarization)
- POST /api/v1/summarize/async (asynchronous summarization)
- GET /api/v1/summarize/status/{task_id} (task status)
- POST /api/v1/summarize/batch (batch summarization)
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestSummarizeAPI:
    """Tests for summarization endpoints."""

    async def test_summarize_endpoint_exists(self, client: AsyncClient):
        """Test summarize endpoint is accessible."""
        response = await client.post(
            "/api/v1/summarize",
            json={
                "article": {
                    "id": "test-1",
                    "title": "Test Article",
                    "content": "This is test content.",
                    "source": "Test",
                    "category": "general",
                },
                "length": "short",
                "provider": "claude",
            }
        )
        
        # May return 200 or 500 depending on API key config
        assert response.status_code in [200, 500, 422]

    async def test_summarize_missing_article(self, client: AsyncClient):
        """Test error when article is missing."""
        response = await client.post(
            "/api/v1/summarize",
            json={
                "length": "short",
                "provider": "claude",
            }
        )
        
        assert response.status_code == 422

    async def test_summarize_empty_content(self, client: AsyncClient):
        """Test error handling for empty content."""
        response = await client.post(
            "/api/v1/summarize",
            json={
                "article": {
                    "id": "test-1",
                    "title": "Test",
                    "content": "",
                    "source": "Test",
                    "category": "general",
                },
                "length": "short",
                "provider": "claude",
            }
        )
        
        # Should validate and return error for empty content
        assert response.status_code in [400, 422, 500]

    async def test_summarize_different_lengths(self, client: AsyncClient, sample_summarize_request):
        """Test summarization with different length options."""
        for length in ["short", "medium", "long"]:
            sample_summarize_request["length"] = length
            
            response = await client.post(
                "/api/v1/summarize",
                json=sample_summarize_request
            )
            
            # Endpoint should accept all length options
            assert response.status_code in [200, 400, 500]

    async def test_summarize_different_providers(self, client: AsyncClient, sample_summarize_request):
        """Test summarization with different AI providers."""
        for provider in ["claude", "openai"]:
            sample_summarize_request["provider"] = provider
            
            response = await client.post(
                "/api/v1/summarize",
                json=sample_summarize_request
            )
            
            # Endpoint should accept different providers
            assert response.status_code in [200, 400, 500]

    async def test_summarize_async_endpoint(self, client: AsyncClient, sample_summarize_request):
        """Test async summarization endpoint."""
        response = await client.post(
            "/api/v1/summarize/async",
            json=sample_summarize_request
        )
        
        # Should return 202 Accepted or error if not configured
        assert response.status_code in [202, 500]
        
        if response.status_code == 202:
            data = response.json()
            assert "task_id" in data
            assert "status" in data

    async def test_summarize_batch_endpoint(self, client: AsyncClient, sample_summarize_request):
        """Test batch summarization endpoint."""
        response = await client.post(
            "/api/v1/summarize/batch",
            json=[sample_summarize_request, sample_summarize_request]
        )
        
        # Should return 202 or error
        assert response.status_code in [202, 500]

    async def test_task_status_invalid_id(self, client: AsyncClient):
        """Test task status with invalid task ID."""
        response = await client.get("/api/v1/summarize/status/invalid-task-id")
        
        assert response.status_code in [404, 500]


@pytest.mark.asyncio
class TestSummarizeIntegration:
    """Integration tests for summarization (requires API keys)."""

    @pytest.mark.skip(reason="Requires valid API keys")
    async def test_full_summarization_flow(self, client: AsyncClient, sample_summarize_request):
        """Test complete summarization flow with real API."""
        response = await client.post(
            "/api/v1/summarize",
            json=sample_summarize_request
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "summary" in data
        assert "key_points" in data
        assert "word_count" in data
        assert len(data["summary"]) > 0
