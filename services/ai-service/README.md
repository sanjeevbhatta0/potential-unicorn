# AI Service

A production-ready FastAPI service for AI-powered text processing with Claude and OpenAI integration.

## Features

- **Article Summarization**: Generate concise summaries with key points extraction
- **Translation**: Translate text between multiple languages
- **Content Moderation**: AI-powered content safety checks
- **Async Processing**: Celery-based task queue for long-running operations
- **Multi-Provider Support**: Switch between Claude and OpenAI
- **Retry Logic**: Automatic retry with exponential backoff
- **Type Safety**: Full Pydantic validation and type hints
- **Monitoring**: Health checks and request timing

## Quick Start

### Prerequisites

- Python 3.11+
- Redis (for Celery)
- Anthropic API key and/or OpenAI API key

### Installation

1. **Clone and navigate to the service directory**:
   ```bash
   cd services/ai-service
   ```

2. **Install dependencies with Poetry** (recommended):
   ```bash
   poetry install
   ```

   Or with pip:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   ```bash
   cp .env .env.local
   # Edit .env.local with your API keys
   ```

4. **Start Redis** (using Docker):
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

### Running the Service

1. **Start the FastAPI server**:
   ```bash
   # With Poetry
   poetry run uvicorn app.main:app --reload

   # Or directly
   python -m app.main
   ```

   The API will be available at `http://localhost:8000`

2. **Start Celery worker** (in a separate terminal):
   ```bash
   # With Poetry
   poetry run celery -A app.tasks.celery_app worker --loglevel=info -Q summarization,default

   # Or directly
   celery -A app.tasks.celery_app worker --loglevel=info -Q summarization,default
   ```

3. **Access the API documentation**:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## API Endpoints

### Summarization

**POST `/api/v1/summarize`** - Synchronous summarization
```bash
curl -X POST "http://localhost:8000/api/v1/summarize" \
  -H "Content-Type: application/json" \
  -d '{
    "article": {
      "content": "Your long article text here...",
      "title": "Article Title"
    },
    "length": "medium",
    "provider": "claude",
    "key_points": true
  }'
```

**POST `/api/v1/summarize/async`** - Asynchronous summarization
```bash
curl -X POST "http://localhost:8000/api/v1/summarize/async" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**GET `/api/v1/summarize/status/{task_id}`** - Check task status
```bash
curl "http://localhost:8000/api/v1/summarize/status/abc123"
```

### Translation

**POST `/api/v1/translate`** - Translate text
```bash
curl -X POST "http://localhost:8000/api/v1/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, world!",
    "target_language": "es",
    "provider": "claude"
  }'
```

**GET `/api/v1/translate/languages`** - List supported languages

### Health Checks

**GET `/health`** - Health check
```bash
curl "http://localhost:8000/health"
```

**GET `/ready`** - Readiness check

## Configuration

All configuration is managed through environment variables in `.env`:

### API Keys
- `ANTHROPIC_API_KEY`: Your Anthropic API key
- `OPENAI_API_KEY`: Your OpenAI API key

### Model Configuration
- `CLAUDE_MODEL`: Claude model to use (default: claude-3-5-sonnet-20241022)
- `OPENAI_MODEL`: OpenAI model to use (default: gpt-4-turbo-preview)
- `MAX_TOKENS`: Maximum tokens for responses (default: 4096)
- `TEMPERATURE`: Model temperature (default: 0.7)

### Celery Configuration
- `CELERY_BROKER_URL`: Redis broker URL (default: redis://localhost:6379/0)
- `CELERY_RESULT_BACKEND`: Redis result backend URL

### Server Configuration
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `DEBUG`: Enable debug mode (default: False)

## Project Structure

```
ai-service/
├── app/
│   ├── agents/              # AI agents (moderator, etc.)
│   │   ├── base_agent.py
│   │   └── moderator.py
│   ├── api/
│   │   └── v1/              # API endpoints
│   │       ├── summarize.py
│   │       └── translate.py
│   ├── core/
│   │   └── config.py        # Settings and configuration
│   ├── models/
│   │   └── article.py       # Pydantic models
│   ├── services/            # Business logic
│   │   ├── summarizer.py
│   │   └── translator.py
│   ├── tasks/               # Celery tasks
│   │   ├── celery_app.py
│   │   └── summarize_task.py
│   └── main.py              # FastAPI application
├── tests/                   # Test files
├── .env                     # Environment variables
├── pyproject.toml           # Poetry configuration
├── requirements.txt         # Pip requirements
└── README.md
```

## Development

### Running Tests
```bash
poetry run pytest
```

### Code Formatting
```bash
poetry run black app/
poetry run ruff check app/
```

### Type Checking
```bash
poetry run mypy app/
```

## Error Handling

The service includes comprehensive error handling:
- Automatic retry with exponential backoff
- Rate limit handling
- Timeout management
- Detailed error responses

## Monitoring

- Request timing headers (`X-Process-Time`)
- Structured logging with Loguru
- Health and readiness endpoints
- Celery task monitoring

## Production Deployment

### Using Docker

1. Build the image:
   ```bash
   docker build -t ai-service .
   ```

2. Run with docker-compose:
   ```bash
   docker-compose up -d
   ```

### Environment Variables in Production

Ensure all required environment variables are set:
- API keys (Anthropic, OpenAI)
- Redis connection
- CORS allowed origins
- Rate limiting settings

## License

MIT
