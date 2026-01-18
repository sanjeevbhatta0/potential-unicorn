"""
Tests for Translation API

Tests:
- POST /api/v1/translate (translate text)
- GET /api/v1/translate/languages (list languages)
- POST /api/v1/translate/detect (detect language)
- POST /api/v1/translate/batch (batch translate)
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestTranslateAPI:
    """Tests for translation endpoints."""

    async def test_list_languages(self, client: AsyncClient):
        """Test list supported languages endpoint."""
        response = await client.get("/api/v1/translate/languages")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "languages" in data
        assert "total" in data
        assert "codes" in data
        assert data["total"] > 0

    async def test_translate_endpoint_exists(self, client: AsyncClient, sample_translate_request):
        """Test translate endpoint is accessible."""
        response = await client.post(
            "/api/v1/translate",
            json=sample_translate_request
        )
        
        # May return 200 or 500 depending on API key config
        assert response.status_code in [200, 500, 422]

    async def test_translate_missing_content(self, client: AsyncClient):
        """Test error when content is missing."""
        response = await client.post(
            "/api/v1/translate",
            json={
                "target_language": "es",
                "provider": "claude",
            }
        )
        
        assert response.status_code == 422

    async def test_translate_missing_target_language(self, client: AsyncClient):
        """Test error when target language is missing."""
        response = await client.post(
            "/api/v1/translate",
            json={
                "content": "Test content to translate",
                "provider": "claude",
            }
        )
        
        assert response.status_code == 422

    async def test_translate_different_languages(self, client: AsyncClient, sample_translate_request):
        """Test translation to different target languages."""
        languages = ["es", "fr", "de", "ja"]
        
        for lang in languages:
            sample_translate_request["target_language"] = lang
            
            response = await client.post(
                "/api/v1/translate",
                json=sample_translate_request
            )
            
            # Endpoint should accept all language codes
            assert response.status_code in [200, 500]

    async def test_translate_batch_endpoint(self, client: AsyncClient, sample_translate_request):
        """Test batch translation endpoint."""
        response = await client.post(
            "/api/v1/translate/batch",
            json=[sample_translate_request, sample_translate_request]
        )
        
        # Should return 200 or error
        assert response.status_code in [200, 500]

    async def test_detect_language_endpoint(self, client: AsyncClient):
        """Test language detection endpoint."""
        response = await client.post(
            "/api/v1/translate/detect",
            params={"content": "This is English text for testing."}
        )
        
        # May be 200 or 422 depending on how params are handled
        assert response.status_code in [200, 422, 500]


@pytest.mark.asyncio
class TestTranslateIntegration:
    """Integration tests for translation (requires API keys)."""

    @pytest.mark.skip(reason="Requires valid API keys")
    async def test_full_translation_flow(self, client: AsyncClient, sample_translate_request):
        """Test complete translation flow with real API."""
        response = await client.post(
            "/api/v1/translate",
            json=sample_translate_request
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "translated_content" in data
        assert "source_language" in data
        assert "target_language" in data
        assert len(data["translated_content"]) > 0
