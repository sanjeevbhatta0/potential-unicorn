# AI Service - Complete Installation Guide

Step-by-step guide to get your AI Service up and running.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [Configuration](#configuration)
4. [Starting the Service](#starting-the-service)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required

- **Python 3.11 or higher**
  ```bash
  python --version  # Should show 3.11 or higher
  ```

- **Redis Server**
  - Option 1: Docker (recommended)
  - Option 2: Local Redis installation

- **API Keys**
  - Anthropic Claude API key (from https://console.anthropic.com)
  - OpenAI API key (from https://platform.openai.com)

### Optional

- **Poetry** (recommended for dependency management)
  ```bash
  curl -sSL https://install.python-poetry.org | python3 -
  ```

- **Docker & Docker Compose** (for containerized deployment)

## Installation Methods

### Method 1: Using Poetry (Recommended)

#### Step 1: Navigate to Service Directory
```bash
cd /home/user/potential-unicorn/services/ai-service
```

#### Step 2: Install Dependencies
```bash
poetry install
```

This will:
- Create a virtual environment
- Install all dependencies
- Set up development tools

#### Step 3: Activate Virtual Environment
```bash
poetry shell
```

### Method 2: Using pip

#### Step 1: Create Virtual Environment
```bash
cd /home/user/potential-unicorn/services/ai-service
python -m venv venv
```

#### Step 2: Activate Virtual Environment
```bash
# On Linux/Mac
source venv/bin/activate

# On Windows
venv\Scripts\activate
```

#### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Method 3: Using Docker

#### Step 1: Build Containers
```bash
cd /home/user/potential-unicorn/services/ai-service
docker-compose build
```

#### Step 2: Start Services
```bash
docker-compose up -d
```

This starts all services:
- API server (port 8000)
- Celery worker
- Celery beat
- Redis

## Configuration

### Step 1: Create Environment File

```bash
cp .env.example .env
```

### Step 2: Edit Environment File

Open `.env` and configure:

```bash
# REQUIRED: Add your API keys
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx

# OPTIONAL: Customize these if needed
CLAUDE_MODEL=claude-3-5-sonnet-20241022
OPENAI_MODEL=gpt-4-turbo-preview
MAX_TOKENS=4096
TEMPERATURE=0.7

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Redis Configuration (default is fine for local)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Step 3: Verify Configuration

```bash
cat .env | grep API_KEY
```

Ensure API keys are set (without exposing the actual keys).

## Starting the Service

### Option 1: Using Start Script (Easiest)

```bash
./scripts/start.sh
```

This script:
- Checks Redis connection
- Starts FastAPI server
- Starts Celery worker
- Provides process IDs

### Option 2: Manual Start (Recommended for Development)

#### Terminal 1: Start Redis

Using Docker:
```bash
docker run -d -p 6379:6379 --name ai-service-redis redis:alpine
```

Or using Makefile:
```bash
make redis
```

Verify Redis is running:
```bash
redis-cli ping
# Should respond: PONG
```

#### Terminal 2: Start API Server

```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or with Makefile:
```bash
make run
```

#### Terminal 3: Start Celery Worker

```bash
poetry run celery -A app.tasks.celery_app worker --loglevel=info -Q summarization,default
```

Or with Makefile:
```bash
make worker
```

### Option 3: Using Docker Compose (Production-like)

```bash
docker-compose up -d
```

View logs:
```bash
docker-compose logs -f
```

Stop services:
```bash
docker-compose down
```

## Verification

### Step 1: Check Health Endpoint

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "AI Service",
  "version": "0.1.0",
  "debug": true,
  "providers": {
    "anthropic": true,
    "openai": true
  },
  "models": {
    "claude": "claude-3-5-sonnet-20241022",
    "openai": "gpt-4-turbo-preview"
  }
}
```

### Step 2: Check Readiness

```bash
curl http://localhost:8000/ready
```

Expected response:
```json
{
  "ready": true,
  "checks": {
    "anthropic_configured": true,
    "openai_configured": true
  }
}
```

### Step 3: Test API Documentation

Open in browser:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

### Step 4: Test Summarization

```bash
curl -X POST "http://localhost:8000/api/v1/summarize" \
  -H "Content-Type: application/json" \
  -d '{
    "article": {
      "content": "This is a test article for summarization. It should work!"
    },
    "provider": "claude",
    "length": "short"
  }'
```

### Step 5: Run Test Suite

```bash
make test
```

Or:
```bash
poetry run pytest -v
```

## Troubleshooting

### Issue: "Redis connection failed"

**Solution 1**: Start Redis with Docker
```bash
docker run -d -p 6379:6379 --name ai-service-redis redis:alpine
```

**Solution 2**: Check Redis status
```bash
redis-cli ping
```

**Solution 3**: Verify Redis URL in `.env`
```bash
CELERY_BROKER_URL=redis://localhost:6379/0
```

### Issue: "Anthropic API key not configured"

**Solution**: Check `.env` file
```bash
grep ANTHROPIC_API_KEY .env
```

Ensure the key is set:
```bash
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

**Verify**: No extra spaces or quotes around the key.

### Issue: "Port 8000 already in use"

**Solution 1**: Change port in `.env`
```bash
PORT=8001
```

**Solution 2**: Kill process on port 8000
```bash
lsof -ti:8000 | xargs kill -9
```

### Issue: "Module not found" errors

**Solution 1**: Reinstall dependencies
```bash
poetry install
# or
pip install -r requirements.txt --force-reinstall
```

**Solution 2**: Ensure virtual environment is activated
```bash
poetry shell
# or
source venv/bin/activate
```

### Issue: Celery worker not processing tasks

**Solution 1**: Check worker is running
```bash
ps aux | grep celery
```

**Solution 2**: Restart worker
```bash
# Stop all celery processes
pkill -f celery

# Restart worker
make worker
```

**Solution 3**: Check Redis connection
```bash
redis-cli ping
```

### Issue: API returns 500 errors

**Solution 1**: Check logs
```bash
# If running locally
# Check the terminal where uvicorn is running

# If using Docker
docker-compose logs api
```

**Solution 2**: Enable debug mode
In `.env`:
```bash
DEBUG=True
```

**Solution 3**: Verify API keys are valid
Test directly with Anthropic/OpenAI CLI tools.

### Issue: Docker build fails

**Solution 1**: Clean Docker cache
```bash
docker-compose down
docker system prune -f
docker-compose build --no-cache
```

**Solution 2**: Check Docker version
```bash
docker --version  # Should be 20.10 or higher
docker-compose --version
```

### Issue: Permission denied on scripts

**Solution**: Make scripts executable
```bash
chmod +x scripts/*.sh
```

## Post-Installation Steps

### 1. Test All Endpoints

Run the test script:
```bash
./scripts/test-api.sh
```

### 2. Configure CORS for Your Frontend

In `.env`:
```bash
ALLOWED_ORIGINS=["http://localhost:3000","http://yourdomain.com"]
```

### 3. Set Up Production Settings

For production:
```bash
DEBUG=False
RATE_LIMIT_ENABLED=True
RATE_LIMIT_PER_MINUTE=60
```

### 4. Monitor Service Health

Set up monitoring:
```bash
# Continuous health check
watch -n 5 curl -s http://localhost:8000/health
```

### 5. Review Documentation

- Full documentation: `README.md`
- Quick start: `QUICKSTART.md`
- Project overview: `PROJECT_SUMMARY.md`
- API docs: http://localhost:8000/docs

## Verification Checklist

After installation, verify:

- [ ] Health endpoint responds with "healthy"
- [ ] Readiness endpoint shows providers configured
- [ ] API documentation loads at /docs
- [ ] Redis is running and accessible
- [ ] Celery worker is processing tasks
- [ ] Test summarization request succeeds
- [ ] Test translation request succeeds
- [ ] Logs show no errors

## Next Steps

1. **Explore API Documentation**
   - Visit http://localhost:8000/docs
   - Try different endpoints
   - Review request/response schemas

2. **Run Example Requests**
   - Test summarization with different lengths
   - Try translation between languages
   - Test content moderation

3. **Customize Configuration**
   - Adjust model parameters
   - Configure rate limiting
   - Set up monitoring

4. **Integrate with Your Application**
   - Use the Python client library
   - Make HTTP requests from your app
   - Set up webhooks (if needed)

## Getting Help

### Resources
- API Documentation: http://localhost:8000/docs
- Health Status: http://localhost:8000/health
- Project README: `README.md`
- Quick Start Guide: `QUICKSTART.md`

### Debug Mode
Enable detailed logging:
```bash
# In .env
DEBUG=True

# Restart service
make run
```

### Log Files
Check logs for errors:
```bash
# Docker logs
docker-compose logs -f

# Local logs
# Check terminal output where services are running
```

## Success!

If you've completed all steps and verified the checklist, your AI Service is ready to use!

Visit http://localhost:8000/docs to start exploring the API.

---

**Need more help?** Check the troubleshooting section or review the full documentation.
