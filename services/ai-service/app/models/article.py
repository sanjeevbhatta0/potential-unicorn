"""Pydantic models for article processing."""

from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, HttpUrl, field_validator


class LanguageCode(str, Enum):
    """Supported language codes."""
    EN = "en"
    NE = "ne"  # Nepali
    HI = "hi"  # Hindi
    ES = "es"
    FR = "fr"
    DE = "de"
    IT = "it"
    PT = "pt"
    JA = "ja"
    ZH = "zh"
    KO = "ko"
    RU = "ru"


class SummaryLength(str, Enum):
    """Summary length options."""
    SHORT = "short"  # ~100 words
    MEDIUM = "medium"  # ~200 words
    LONG = "long"  # ~500 words


class AIProvider(str, Enum):
    """AI provider options."""
    CLAUDE = "claude"
    OPENAI = "openai"
    GEMINI = "gemini"


class ArticleInput(BaseModel):
    """Input model for article content."""
    content: str = Field(..., min_length=10, description="Article content to process")
    title: Optional[str] = Field(None, description="Article title")
    url: Optional[HttpUrl] = Field(None, description="Source URL")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")


class SummarizeRequest(BaseModel):
    """Request model for article summarization."""
    article: ArticleInput
    length: SummaryLength = Field(default=SummaryLength.MEDIUM, description="Desired summary length")
    provider: AIProvider = Field(default=AIProvider.CLAUDE, description="AI provider to use")
    key_points: bool = Field(default=True, description="Include key points extraction")
    language: LanguageCode = Field(default=LanguageCode.EN, description="Output language")

    @field_validator("article")
    @classmethod
    def validate_content_length(cls, v: ArticleInput) -> ArticleInput:
        """Validate article content length."""
        if len(v.content) > 50000:
            raise ValueError("Article content too long (max 50,000 characters)")
        return v


class SummarizeResponse(BaseModel):
    """Response model for article summarization."""
    summary: str = Field(..., description="Generated summary")
    key_points: Optional[List[str]] = Field(None, description="Extracted key points")
    category: Optional[str] = Field(None, description="AI-determined article category")
    word_count: int = Field(..., description="Word count of summary")
    original_length: int = Field(..., description="Original article length")
    reduction_ratio: float = Field(..., description="Reduction ratio (0-1)")
    provider: AIProvider = Field(..., description="AI provider used")
    model: str = Field(..., description="Model used")
    processing_time: float = Field(..., description="Processing time in seconds")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class TranslateRequest(BaseModel):
    """Request model for translation."""
    content: str = Field(..., min_length=1, max_length=10000, description="Content to translate")
    source_language: Optional[LanguageCode] = Field(None, description="Source language (auto-detect if None)")
    target_language: LanguageCode = Field(..., description="Target language")
    provider: AIProvider = Field(default=AIProvider.CLAUDE, description="AI provider to use")
    preserve_formatting: bool = Field(default=True, description="Preserve original formatting")


class TranslateResponse(BaseModel):
    """Response model for translation."""
    translated_content: str = Field(..., description="Translated content")
    source_language: LanguageCode = Field(..., description="Detected or provided source language")
    target_language: LanguageCode = Field(..., description="Target language")
    provider: AIProvider = Field(..., description="AI provider used")
    model: str = Field(..., description="Model used")
    confidence: Optional[float] = Field(None, description="Translation confidence score")
    processing_time: float = Field(..., description="Processing time in seconds")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class ModerationRequest(BaseModel):
    """Request model for content moderation."""
    content: str = Field(..., min_length=1, max_length=10000, description="Content to moderate")
    strict_mode: bool = Field(default=False, description="Use strict moderation rules")


class ModerationCategory(str, Enum):
    """Moderation category types."""
    HATE_SPEECH = "hate_speech"
    VIOLENCE = "violence"
    SEXUAL_CONTENT = "sexual_content"
    HARASSMENT = "harassment"
    SELF_HARM = "self_harm"
    SPAM = "spam"
    MISINFORMATION = "misinformation"
    SAFE = "safe"


class ModerationResult(BaseModel):
    """Result for a single moderation category."""
    category: ModerationCategory
    flagged: bool
    confidence: float = Field(..., ge=0.0, le=1.0)
    explanation: Optional[str] = None


class ModerationResponse(BaseModel):
    """Response model for content moderation."""
    is_safe: bool = Field(..., description="Overall safety determination")
    results: List[ModerationResult] = Field(..., description="Per-category results")
    overall_risk_score: float = Field(..., ge=0.0, le=1.0, description="Overall risk score")
    recommended_action: str = Field(..., description="Recommended action (allow/review/block)")
    provider: AIProvider = Field(..., description="AI provider used")
    processing_time: float = Field(..., description="Processing time in seconds")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class TaskStatus(str, Enum):
    """Task status options."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskResponse(BaseModel):
    """Response model for async task submission."""
    task_id: str = Field(..., description="Task ID for status checking")
    status: TaskStatus = Field(..., description="Current task status")
    estimated_completion: Optional[datetime] = Field(None, description="Estimated completion time")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Task creation timestamp")


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    code: Optional[str] = Field(None, description="Error code")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
