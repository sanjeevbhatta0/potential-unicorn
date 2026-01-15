"""FastAPI AI Service main application."""

from contextlib import asynccontextmanager
from typing import AsyncIterator, Dict, Any
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import sys
import time

from app.core.config import settings
from app.api.v1 import summarize, translate, moderate, credibility
from app.models.article import ErrorResponse


# Configure logging
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO" if not settings.debug else "DEBUG",
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Lifecycle manager for FastAPI application.

    Handles startup and shutdown events.
    """
    # Startup
    logger.info(f"Starting {settings.project_name} v{settings.version}")
    logger.info(f"Environment: {'Development' if settings.debug else 'Production'}")
    logger.info(f"Claude Model: {settings.claude_model}")
    logger.info(f"OpenAI Model: {settings.openai_model}")

    # Verify API keys
    if not settings.anthropic_api_key:
        logger.warning("Anthropic API key not configured")
    if not settings.openai_api_key:
        logger.warning("OpenAI API key not configured")

    yield

    # Shutdown
    logger.info(f"Shutting down {settings.project_name}")


# Create FastAPI application
app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    description="AI Service with Claude and OpenAI integration for summarization, translation, and moderation",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GZip middleware for response compression
app.add_middleware(GZipMiddleware, minimum_size=1000)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time header to responses."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Exception handlers
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    """Handle ValueError exceptions."""
    logger.error(f"ValueError: {exc}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=ErrorResponse(
            error="Validation Error",
            detail=str(exc),
            code="VALIDATION_ERROR",
        ).dict(),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Internal Server Error",
            detail=str(exc) if settings.debug else "An unexpected error occurred",
            code="INTERNAL_ERROR",
        ).dict(),
    )


# Health check endpoint
@app.get(
    "/health",
    tags=["health"],
    summary="Health check",
    description="Check service health and status",
)
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint.

    Returns service status, version, and configuration info.
    """
    return {
        "status": "healthy",
        "service": settings.project_name,
        "version": settings.version,
        "debug": settings.debug,
        "providers": {
            "anthropic": bool(settings.anthropic_api_key),
            "openai": bool(settings.openai_api_key),
        },
        "models": {
            "claude": settings.claude_model,
            "openai": settings.openai_model,
        },
    }


# Readiness check endpoint
@app.get(
    "/ready",
    tags=["health"],
    summary="Readiness check",
    description="Check if service is ready to accept requests",
)
async def readiness_check() -> Dict[str, Any]:
    """
    Readiness check endpoint.

    Verifies that the service has required dependencies and can process requests.
    """
    ready = True
    checks = {}

    # Check API keys
    checks["anthropic_configured"] = bool(settings.anthropic_api_key)
    checks["openai_configured"] = bool(settings.openai_api_key)

    # Service is ready if at least one provider is configured
    ready = checks["anthropic_configured"] or checks["openai_configured"]

    return {
        "ready": ready,
        "checks": checks,
    }


# Root endpoint
@app.get(
    "/",
    tags=["root"],
    summary="Root endpoint",
    description="Get API information",
)
async def root() -> Dict[str, Any]:
    """
    Root endpoint with API information.
    """
    return {
        "service": settings.project_name,
        "version": settings.version,
        "docs": "/docs",
        "health": "/health",
        "api": {
            "v1": {
                "summarize": f"{settings.api_v1_prefix}/summarize",
                "translate": f"{settings.api_v1_prefix}/translate",
                "moderate": f"{settings.api_v1_prefix}/moderate",
                "credibility": f"{settings.api_v1_prefix}/credibility",
            }
        },
    }


# Include API routers
app.include_router(
    summarize.router,
    prefix=settings.api_v1_prefix,
)
app.include_router(
    translate.router,
    prefix=settings.api_v1_prefix,
)
app.include_router(
    moderate.router,
    prefix=settings.api_v1_prefix,
)
app.include_router(
    credibility.router,
    prefix=settings.api_v1_prefix,
)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info" if not settings.debug else "debug",
    )
