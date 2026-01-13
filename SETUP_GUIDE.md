# Complete Setup Guide

This guide will walk you through setting up the complete Nepali News Hub development environment from scratch.

## Prerequisites

Make sure you have the following installed on your system:

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://python.org/))
- **Docker** & **Docker Compose** ([Download](https://docker.com/))
- **pnpm** 8+ (Install via: `npm install -g pnpm`)
- **Git** ([Download](https://git-scm.com/))

### Verify Installation

```bash
node --version    # Should show v20.x.x or higher
python --version  # Should show Python 3.11.x or higher
docker --version  # Should show Docker version 24.x.x or higher
pnpm --version    # Should show 8.x.x or higher
git --version     # Should show git version 2.x.x or higher
```

## Step 1: Clone the Repository

```bash
git clone https://github.com/sanjeevbhatta0/potential-unicorn.git
cd potential-unicorn
```

## Step 2: Start Infrastructure Services

Start PostgreSQL, Redis, MinIO, and Meilisearch using Docker:

```bash
# Make the script executable
chmod +x infrastructure/scripts/start-dev.sh

# Start all infrastructure services
./infrastructure/scripts/start-dev.sh

# Or manually:
cd infrastructure/docker
docker-compose up -d
```

**Verify services are running:**

```bash
docker ps

# You should see 5 containers:
# - nepali-news-db (PostgreSQL)
# - nepali-news-redis (Redis)
# - nepali-news-minio (MinIO)
# - nepali-news-search (Meilisearch)
# - nepali-news-adminer (Database UI)
```

**Access Infrastructure:**
- PostgreSQL: `localhost:5432` (user: `postgres`, password: `postgres123`)
- Redis: `localhost:6379` (password: `redis123`)
- MinIO Console: http://localhost:9001 (user: `minioadmin`, password: `minioadmin123`)
- Meilisearch: http://localhost:7700
- Adminer (DB UI): http://localhost:8080

## Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your API keys
nano .env  # or use your preferred editor
```

**Required API Keys:**
- `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys
- `ANTHROPIC_API_KEY` - Get from https://console.anthropic.com/

**Update these values in .env:**
```env
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

## Step 4: Install Dependencies

Install all Node.js dependencies for the monorepo:

```bash
# Install all dependencies (this may take a few minutes)
pnpm install
```

## Step 5: Setup NestJS API

```bash
cd apps/api

# Copy environment file
cp .env.example .env
# Edit .env with your database credentials (if different from defaults)

# Create database tables
pnpm build
pnpm typeorm migration:run

# (Optional) Seed initial data
pnpm seed

# Go back to root
cd ../..
```

## Step 6: Setup Python AI Service

```bash
cd services/ai-service

# Install Poetry (if not already installed)
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install

# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Test the installation
poetry run python -c "import fastapi; print('FastAPI installed successfully!')"

# Go back to root
cd ../..
```

## Step 7: Setup News Crawler Service

```bash
cd services/crawler

# Install dependencies
pnpm install

# Install Playwright browsers
npx playwright install chromium

# Copy environment file
cp .env.example .env

# Go back to root
cd ../..
```

## Step 8: Setup Next.js Web App

```bash
cd apps/web

# Copy environment file
cp .env.local.example .env.local
# Edit if needed (defaults should work for local development)

# Go back to root
cd ../..
```

## Step 9: Start All Services

Open **4 separate terminal windows/tabs**:

### Terminal 1: NestJS API
```bash
cd apps/api
pnpm dev

# API will start on http://localhost:3333
# Swagger docs: http://localhost:3333/api/docs
```

### Terminal 2: Python AI Service
```bash
cd services/ai-service
poetry run uvicorn app.main:app --reload

# AI Service will start on http://localhost:8000
# API docs: http://localhost:8000/docs
```

### Terminal 3: News Crawler
```bash
cd services/crawler
pnpm dev

# Crawler will run every 30 minutes
# Or run once: pnpm dev -- --once
```

### Terminal 4: Next.js Web App
```bash
cd apps/web
pnpm dev

# Web app will start on http://localhost:3000
```

## Step 10: Verify Everything is Working

### Check Health Endpoints

```bash
# API Health
curl http://localhost:3333

# AI Service Health
curl http://localhost:8000/health

# Web App
curl http://localhost:3000
```

### Open in Browser

1. **Web App**: http://localhost:3000
2. **API Docs**: http://localhost:3333/api/docs
3. **AI Service Docs**: http://localhost:8000/docs
4. **MinIO Console**: http://localhost:9001
5. **Database UI**: http://localhost:8080

## Alternative: Use Turbo to Start Everything

From the root directory, you can start all services at once:

```bash
# Start all services (web, api, crawler)
pnpm dev
```

**Note**: This will start all services in a single terminal. For better debugging, we recommend running each service in a separate terminal.

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

```bash
# Find and kill the process
# For port 3000 (Web):
lsof -ti:3000 | xargs kill -9

# For port 3333 (API):
lsof -ti:3333 | xargs kill -9

# For port 8000 (AI Service):
lsof -ti:8000 | xargs kill -9
```

### Docker Services Not Starting

```bash
# Stop all containers
docker-compose -f infrastructure/docker/docker-compose.yml down

# Remove volumes and start fresh
docker-compose -f infrastructure/docker/docker-compose.yml down -v
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs nepali-news-db

# Restart PostgreSQL
docker restart nepali-news-db
```

### Redis Connection Failed

```bash
# Check if Redis is running
docker ps | grep redis

# Test Redis connection
docker exec -it nepali-news-redis redis-cli -a redis123 ping
# Should return: PONG
```

### Python Dependencies Issues

```bash
# Clear Poetry cache and reinstall
cd services/ai-service
poetry cache clear pypi --all
rm -rf .venv
poetry install
```

### Node Modules Issues

```bash
# Clear pnpm cache and reinstall
pnpm store prune
rm -rf node_modules
pnpm install
```

## Testing the Application

### Test the API

```bash
# Register a new user
curl -X POST http://localhost:3333/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "fullName": "Test User"
  }'

# Login
curl -X POST http://localhost:3333/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

### Test the AI Service

```bash
# Test summarization
curl -X POST http://localhost:8000/api/v1/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a test article about Nepali news...",
    "language": "en"
  }'
```

### Test the Crawler

```bash
# Run crawler once
cd services/crawler
pnpm dev -- --once

# Check logs
tail -f logs/crawler.log
```

## Next Steps

1. **Create Your First News Source**
   - Use the API to add news sources
   - Configure crawlers for each source

2. **Test Article Crawling**
   - Run the crawler
   - Verify articles appear in the database

3. **Customize the Frontend**
   - Modify components in `apps/web/src/components`
   - Update styling in `apps/web/src/app/globals.css`

4. **Add More Features**
   - Implement user authentication in the frontend
   - Add bookmarking functionality
   - Create admin dashboard

## Production Deployment

For production deployment, see:
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) (Coming soon)
- [Docker Production Setup](./infrastructure/docker/README.md) (Coming soon)

## Getting Help

- Check the [FAQ](./docs/FAQ.md)
- Review [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- Open an issue on GitHub
- Review logs in `./logs/` directory

## Development Tips

### VS Code Extensions

Install these recommended extensions:
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- Python
- Docker

### Hot Reload

All services support hot reload in development:
- Changes to TypeScript files will auto-reload
- Changes to Python files will auto-reload (with `--reload` flag)
- Changes to React components will hot reload

### Database GUI

Use Adminer (http://localhost:8080) or connect with:
- TablePlus
- DBeaver
- pgAdmin

## Summary

You now have a complete Nepali News Hub development environment running! 🎉

**Services Running:**
- ✅ PostgreSQL (Database)
- ✅ Redis (Cache & Queue)
- ✅ MinIO (Object Storage)
- ✅ Meilisearch (Search Engine)
- ✅ NestJS API (Backend)
- ✅ Python AI Service (Summarization)
- ✅ News Crawler (Content Aggregation)
- ✅ Next.js Web App (Frontend)

Happy coding! 🚀
