# AI Service - Quick Start Guide

Get up and running with the AI Service in under 5 minutes!

## Prerequisites

- Python 3.11 or higher
- Redis (or Docker to run Redis)
- API keys for Anthropic Claude and/or OpenAI

## Installation Steps

### 1. Install Dependencies

Using **Poetry** (recommended):
```bash
cd services/ai-service
poetry install
```

Or using **pip**:
```bash
cd services/ai-service
pip install -r requirements.txt
```

### 2. Configure API Keys

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-key-here
```

### 3. Start Redis

Using Docker (easiest):
```bash
docker run -d -p 6379:6379 --name ai-service-redis redis:alpine
```

Or using the Makefile:
```bash
make redis
```

### 4. Start the Service

#### Option A: Using the Start Script
```bash
./scripts/start.sh
```

#### Option B: Manual Start
Terminal 1 - API Server:
```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2 - Celery Worker:
```bash
poetry run celery -A app.tasks.celery_app worker --loglevel=info -Q summarization,default
```

#### Option C: Using Docker Compose
```bash
docker-compose up -d
```

#### Option D: Using Makefile
```bash
make run      # Start API server
make worker   # Start Celery worker (in another terminal)
```

## Verify Installation

### 1. Check Health
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "AI Service",
  "version": "0.1.0",
  "providers": {
    "anthropic": true,
    "openai": true
  }
}
```

### 2. View API Documentation
Open in your browser:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Quick Examples

### Example 1: Summarize an Article

```bash
curl -X POST "http://localhost:8000/api/v1/summarize" \
  -H "Content-Type: application/json" \
  -d '{
    "article": {
      "content": "Artificial intelligence is transforming how we live and work. Machine learning models can now understand natural language, generate creative content, and solve complex problems. The field has seen rapid advancement in recent years, with applications ranging from healthcare to autonomous vehicles. As AI continues to evolve, it presents both opportunities and challenges for society.",
      "title": "The AI Revolution"
    },
    "length": "short",
    "provider": "claude",
    "key_points": true
  }'
```

### Example 2: Translate Text

```bash
curl -X POST "http://localhost:8000/api/v1/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, how are you doing today?",
    "target_language": "es",
    "provider": "claude"
  }'
```

### Example 3: Moderate Content

```bash
curl -X POST "http://localhost:8000/api/v1/moderate" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a sample text for content moderation.",
    "strict_mode": false
  }'
```

### Example 4: Async Summarization

```bash
# Submit task
curl -X POST "http://localhost:8000/api/v1/summarize/async" \
  -H "Content-Type: application/json" \
  -d '{
    "article": {
      "content": "Your long article here..."
    },
    "provider": "claude"
  }'

# Check status (use task_id from previous response)
curl "http://localhost:8000/api/v1/summarize/status/{task_id}"
```

## Using Python Client

```python
import httpx

# Summarize
async def summarize_article():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/summarize",
            json={
                "article": {
                    "content": "Your article content here..."
                },
                "length": "medium",
                "provider": "claude",
                "key_points": True
            }
        )
        return response.json()

# Translate
async def translate_text():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/translate",
            json={
                "content": "Hello, world!",
                "target_language": "es",
                "provider": "claude"
            }
        )
        return response.json()
```

## Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/ready` | GET | Readiness check |
| `/api/v1/summarize` | POST | Synchronous summarization |
| `/api/v1/summarize/async` | POST | Async summarization |
| `/api/v1/summarize/status/{id}` | GET | Check task status |
| `/api/v1/translate` | POST | Translate text |
| `/api/v1/translate/languages` | GET | List languages |
| `/api/v1/moderate` | POST | Moderate content |

## Supported Features

### Summarization
- **Lengths**: short (~100 words), medium (~200 words), long (~500 words)
- **Providers**: Claude (Anthropic), GPT-4 (OpenAI)
- **Features**: Key points extraction, custom length, multi-language

### Translation
- **Languages**: English, Spanish, French, German, Italian, Portuguese, Japanese, Chinese, Korean, Russian
- **Providers**: Claude (Anthropic), GPT-4 (OpenAI)
- **Features**: Auto-detect source language, preserve formatting

### Moderation
- **Categories**: Hate speech, violence, sexual content, harassment, self-harm, spam, misinformation
- **Modes**: Normal and strict moderation
- **Output**: Per-category analysis, overall risk score, recommended action

## Configuration Options

Edit `.env` to customize:

```bash
# Model Selection
CLAUDE_MODEL=claude-3-5-sonnet-20241022
OPENAI_MODEL=gpt-4-turbo-preview

# Model Parameters
MAX_TOKENS=4096
TEMPERATURE=0.7

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60

# Retry Logic
MAX_RETRIES=3
RETRY_MIN_WAIT=1
RETRY_MAX_WAIT=10
```

## Troubleshooting

### Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping

# Start Redis with Docker
docker run -d -p 6379:6379 redis:alpine
```

### API Key Not Working
- Verify the key format in `.env`
- Ensure no extra spaces or quotes
- Check API key validity on provider's dashboard

### Import Errors
```bash
# Reinstall dependencies
poetry install
# or
pip install -r requirements.txt --force-reinstall
```

### Port Already in Use
```bash
# Change port in .env
PORT=8001

# Or kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

## Next Steps

1. Read the full [README.md](README.md) for detailed documentation
2. Explore API docs at http://localhost:8000/docs
3. Run tests: `make test` or `poetry run pytest`
4. Check out example scripts in `scripts/`

## Useful Commands

```bash
# Run tests
make test

# Format code
make format

# Check code quality
make lint

# Start services with Docker
make docker-up

# View logs
make docker-logs

# Stop services
make docker-down
```

## Getting Help

- API Documentation: http://localhost:8000/docs
- Health Status: http://localhost:8000/health
- Check logs for detailed error messages

## Production Deployment

For production deployment:
1. Set `DEBUG=False` in `.env`
2. Use proper API key management (secrets manager)
3. Configure CORS origins for your domain
4. Use Docker Compose or Kubernetes
5. Set up monitoring and logging
6. Enable rate limiting
7. Use HTTPS/TLS

See [README.md](README.md) for production deployment details.
