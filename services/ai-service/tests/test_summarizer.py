"""Tests for summarizer service."""

import pytest
from unittest.mock import Mock, patch, AsyncMock

from app.models.article import (
    SummarizeRequest,
    ArticleInput,
    SummaryLength,
    AIProvider,
)
from app.services.summarizer import SummarizerService


@pytest.fixture
def summarizer():
    """Create summarizer service instance."""
    return SummarizerService()


@pytest.fixture
def sample_request():
    """Create sample summarization request."""
    return SummarizeRequest(
        article=ArticleInput(
            content="This is a long article that needs to be summarized. " * 50,
            title="Sample Article",
        ),
        length=SummaryLength.MEDIUM,
        provider=AIProvider.CLAUDE,
        key_points=True,
    )


def test_get_word_target(summarizer):
    """Test word target calculation."""
    assert summarizer._get_word_target(SummaryLength.SHORT) == 100
    assert summarizer._get_word_target(SummaryLength.MEDIUM) == 200
    assert summarizer._get_word_target(SummaryLength.LONG) == 500


def test_build_system_prompt(summarizer, sample_request):
    """Test system prompt generation."""
    prompt = summarizer._build_system_prompt(sample_request)
    assert "200 words" in prompt
    assert "key points" in prompt.lower()


def test_parse_response_with_markers(summarizer):
    """Test response parsing with markers."""
    content = """[SUMMARY]
This is the summary text.

[KEY POINTS]
- Point 1
- Point 2
- Point 3"""

    summary, key_points = summarizer._parse_response(content, True)
    assert summary == "This is the summary text."
    assert len(key_points) == 3
    assert "Point 1" in key_points


def test_parse_response_without_markers(summarizer):
    """Test response parsing without markers."""
    content = "This is just the summary text."
    summary, key_points = summarizer._parse_response(content, True)
    assert summary == content
    assert key_points is None


@pytest.mark.asyncio
async def test_summarize_with_mock():
    """Test summarization with mocked API."""
    with patch("app.services.summarizer.Anthropic") as mock_anthropic:
        # Setup mock
        mock_client = Mock()
        mock_response = Mock()
        mock_response.content = [Mock(text="Summary text")]
        mock_response.usage = Mock(input_tokens=100, output_tokens=50)
        mock_client.messages.create = Mock(return_value=mock_response)
        mock_anthropic.return_value = mock_client

        # Create service and request
        service = SummarizerService()
        service.anthropic_client = mock_client

        request = SummarizeRequest(
            article=ArticleInput(content="Test article content"),
            provider=AIProvider.CLAUDE,
        )

        # Execute
        response = await service.summarize(request)

        # Verify
        assert response.summary == "Summary text"
        assert response.provider == AIProvider.CLAUDE
        assert mock_client.messages.create.called
