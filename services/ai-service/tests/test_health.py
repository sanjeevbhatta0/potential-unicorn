"""
Tests for AI Service Health Endpoints

Tests:
- GET /health (health check)
- GET /ready (readiness check)
- GET / (root info)
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestHealthEndpoints:
    """Tests for health check endpoints."""

    async def test_health_check(self, client: AsyncClient):
        """Test health check endpoint returns healthy status."""
        response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"
        assert "service" in data
        assert "version" in data
        assert "providers" in data
        assert "models" in data

    async def test_health_check_providers_info(self, client: AsyncClient):
        """Test health check includes provider configuration."""
        response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        providers = data["providers"]
        assert "anthropic" in providers
        assert "openai" in providers

    async def test_readiness_check(self, client: AsyncClient):
        """Test readiness check endpoint."""
        response = await client.get("/ready")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "ready" in data
        assert "checks" in data

    async def test_root_endpoint(self, client: AsyncClient):
        """Test root endpoint returns API info."""
        response = await client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "service" in data
        assert "version" in data
        assert "docs" in data
        assert "api" in data

    async def test_docs_accessible(self, client: AsyncClient):
        """Test OpenAPI docs are accessible."""
        response = await client.get("/docs")
        
        # Should redirect or return HTML
        assert response.status_code in [200, 307]


@pytest.mark.asyncio
class TestErrorHandling:
    """Tests for error handling."""

    async def test_404_for_invalid_route(self, client: AsyncClient):
        """Test 404 for non-existent routes."""
        response = await client.get("/non-existent-endpoint")
        
        assert response.status_code == 404

    async def test_method_not_allowed(self, client: AsyncClient):
        """Test 405 for invalid HTTP method."""
        response = await client.delete("/health")
        
        assert response.status_code == 405

    async def test_json_content_type(self, client: AsyncClient):
        """Test responses have correct content type."""
        response = await client.get("/health")
        
        assert "application/json" in response.headers.get("content-type", "")
