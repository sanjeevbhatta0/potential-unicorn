# Local Testing Guide

This guide will walk you through deploying and testing the Nepali News Hub on your local machine.

## 🎯 Quick Start (Automated)

The easiest way to deploy locally is using the automated script:

```bash
./deploy-local.sh
```

This script will:
1. ✅ Check all prerequisites
2. ✅ Start Docker infrastructure
3. ✅ Setup environment variables
4. ✅ Install all dependencies
5. ✅ Build shared packages
6. ✅ Setup all services

**After the script completes**, follow the instructions to start each service in separate terminals.

---

## 📋 Manual Setup (If Script Fails)

### Step 1: Verify Prerequisites

```bash
# Check versions
node --version    # Should be v20+
pnpm --version    # Should be 8+
python3 --version # Should be 3.11+
docker --version  # Should be 24+
```

### Step 2: Start Infrastructure Services

```bash
cd infrastructure/docker
docker compose up -d

# Wait for services to be healthy
docker compose ps

# You should see all services as "healthy" or "running"
```

Verify services are running:

```bash
# PostgreSQL
docker exec nepali-news-db pg_isready -U postgres

# Redis
docker exec nepali-news-redis redis-cli -a redis123 ping

# Should see "PONG"
```

### Step 3: Setup Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or use any text editor
```

**Required API Keys:**
- `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys
- `ANTHROPIC_API_KEY` - Get from https://console.anthropic.com/

Update these lines in `.env`:
```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key-here
```

### Step 4: Install Dependencies

```bash
# Install root dependencies
pnpm install

# Install and build shared packages
cd packages/types && pnpm install && cd ../..
cd packages/utils && pnpm install && cd ../..
cd packages/config && pnpm install && cd ../..
```

### Step 5: Setup NestJS API

```bash
cd apps/api

# Copy environment file
cp ../../.env .env

# Install dependencies
pnpm install

# Build the application
pnpm build

# For now, we'll skip migrations (we'll create them on first run)
```

### Step 6: Setup Python AI Service

```bash
cd services/ai-service

# Install Poetry if not installed
curl -sSL https://install.python-poetry.org | python3 -

# Add Poetry to PATH (if needed)
export PATH="$HOME/.local/bin:$PATH"

# Install dependencies
poetry install

# Copy environment file
cp .env.example .env
# Edit and add your API keys
```

### Step 7: Setup News Crawler

```bash
cd services/crawler

# Install dependencies
pnpm install

# Install Playwright browsers
npx playwright install chromium

# Copy environment file
cp .env.example .env
```

### Step 8: Setup Next.js Web App

```bash
cd apps/web

# Install dependencies
pnpm install

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3333
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
```

---

## 🚀 Starting All Services

Open **4 separate terminal windows/tabs** and run each command in its own terminal:

### Terminal 1: NestJS API Backend

```bash
cd apps/api
pnpm dev
```

**Expected output:**
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [NestApplication] Nest application successfully started
[Nest] INFO Application is running on: http://localhost:3333
```

**Verify:**
```bash
# In another terminal
curl http://localhost:3333
# Should return: {"message":"Nepali News Hub API","version":"1.0.0"}
```

**Access Swagger docs:** http://localhost:3333/api/docs

---

### Terminal 2: Python AI Service

```bash
cd services/ai-service
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Verify:**
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

**Access API docs:** http://localhost:8000/docs

---

### Terminal 3: News Crawler

```bash
cd services/crawler
pnpm dev
```

**Expected output:**
```
[Crawler] Starting news crawler service...
[Crawler] Scheduling crawl jobs every 30 minutes
[Crawler] Crawler is ready
```

**Note:** The crawler will run every 30 minutes. To run immediately once:
```bash
pnpm dev -- --once
```

---

### Terminal 4: Next.js Web App

```bash
cd apps/web
pnpm dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3000
- event compiled client and server successfully
- wait compiling...
- event compiled successfully
```

**Access the app:** http://localhost:3000

---

## ✅ Verification Checklist

### 1. Infrastructure Health Checks

```bash
# Check all Docker containers
docker ps

# Should see 5 containers running:
# - nepali-news-db (PostgreSQL)
# - nepali-news-redis (Redis)
# - nepali-news-minio (MinIO)
# - nepali-news-search (Meilisearch)
# - nepali-news-adminer (Adminer)
```

### 2. API Health Checks

```bash
# API Backend
curl http://localhost:3333
curl http://localhost:3333/api/v1/health

# AI Service
curl http://localhost:8000
curl http://localhost:8000/health

# Web App
curl http://localhost:3000/api/health
```

### 3. Database Connection

```bash
# Access database UI
# Open http://localhost:8080 in browser
# System: PostgreSQL
# Server: postgres
# Username: postgres
# Password: postgres123
# Database: nepali_news_dev
```

### 4. Test API Endpoints

**Register a new user:**
```bash
curl -X POST http://localhost:3333/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "fullName": "Test User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3333/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

Save the `access_token` from the response.

**Get articles (with auth):**
```bash
curl http://localhost:3333/api/v1/articles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 5. Test AI Service

**Test summarization:**
```bash
curl -X POST http://localhost:8000/api/v1/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "काठमाडौं । नेपाल सरकारले आज नयाँ नीति घोषणा गरेको छ। यो नीतिले शिक्षा क्षेत्रमा महत्वपूर्ण सुधार ल्याउने अपेक्षा गरिएको छ।",
    "language": "ne",
    "length": "short"
  }'
```

**Test translation:**
```bash
curl -X POST http://localhost:8000/api/v1/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "नमस्ते, तपाईंलाई कस्तो छ?",
    "source_language": "ne",
    "target_language": "en"
  }'
```

### 6. Test Web Interface

1. Open http://localhost:3000
2. Should see the home page with a news feed
3. Try navigating to:
   - Categories: http://localhost:3000/categories/politics
   - Search: http://localhost:3000/search
   - Article detail (once articles are crawled)

### 7. Test News Crawler

**Run crawler once:**
```bash
cd services/crawler
pnpm dev -- --once
```

**Check logs:**
```bash
# Should see output like:
[OnlineKhabar] Crawling started...
[OnlineKhabar] Found 20 articles
[OnlineKhabar] Processing article: "नेपालमा..."
[Processor] Article saved to database
```

**Verify articles in database:**
```bash
# Using database UI at http://localhost:8080
# Or using psql:
docker exec -it nepali-news-db psql -U postgres -d nepali_news_dev -c "SELECT COUNT(*) FROM articles;"
```

---

## 🧪 Complete Testing Workflow

### Scenario: Full User Journey

1. **Start all services** (4 terminals as shown above)

2. **Access the web app:** http://localhost:3000
   - Should see empty state (no articles yet)

3. **Run the crawler once:**
   ```bash
   cd services/crawler
   pnpm dev -- --once
   ```
   - Wait for it to complete (2-5 minutes)
   - Should crawl articles from Online Khabar, eKantipur, Setopati

4. **Refresh the web app**
   - Should now see articles appearing
   - Click on an article to view details
   - Try searching for keywords
   - Filter by category

5. **Register and login:**
   - Click "Login" in header
   - Create an account
   - Login with credentials

6. **Test article interactions:**
   - View articles (view count should increment)
   - Bookmark articles (if implemented)
   - Search for specific topics

7. **Check AI summarization:**
   - View article detail page
   - Should see AI-generated summary
   - Should see extracted highlights

---

## 🐛 Troubleshooting

### Issue: Port Already in Use

```bash
# Find process using the port
lsof -ti:3000 | xargs kill -9  # Web app
lsof -ti:3333 | xargs kill -9  # API
lsof -ti:8000 | xargs kill -9  # AI Service
```

### Issue: Docker Services Not Starting

```bash
# Stop all services
cd infrastructure/docker
docker compose down

# Remove volumes and start fresh
docker compose down -v
docker compose up -d

# Check logs
docker compose logs -f
```

### Issue: Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs nepali-news-db

# Restart PostgreSQL
docker restart nepali-news-db

# Wait for it to be healthy
docker exec nepali-news-db pg_isready -U postgres
```

### Issue: Redis Connection Failed

```bash
# Check if Redis is running
docker ps | grep redis

# Test connection
docker exec -it nepali-news-redis redis-cli -a redis123 ping

# Should return: PONG

# Restart if needed
docker restart nepali-news-redis
```

### Issue: AI Service API Key Errors

```bash
# Make sure you've added your API keys to .env
cat services/ai-service/.env | grep API_KEY

# Should show your actual keys (not "your-xxx-key")
```

### Issue: Crawler Not Finding Articles

```bash
# Check internet connection
curl https://www.onlinekhabar.com

# Check crawler logs
cd services/crawler
pnpm dev -- --once --verbose

# Test individual crawler
pnpm dev -- --source onlinekhabar --once
```

### Issue: CORS Errors in Browser

Make sure the API is configured to allow requests from localhost:3000. This should be set by default, but verify in `apps/api/src/main.ts`.

### Issue: Dependencies Installation Failed

```bash
# Clear caches and reinstall
pnpm store prune
rm -rf node_modules
pnpm install

# For Python
cd services/ai-service
poetry cache clear pypi --all
rm -rf .venv
poetry install
```

---

## 📊 Monitoring & Logs

### View All Service Logs

**Infrastructure logs:**
```bash
cd infrastructure/docker
docker compose logs -f
```

**API logs:**
```bash
cd apps/api
pnpm dev
# Logs appear in terminal
```

**AI Service logs:**
```bash
cd services/ai-service
poetry run uvicorn app.main:app --reload --log-level debug
```

**Crawler logs:**
```bash
cd services/crawler
pnpm dev
# Check logs/crawler.log
tail -f logs/crawler.log
```

### Access UIs

- **Database UI (Adminer):** http://localhost:8080
- **MinIO Console:** http://localhost:9001
- **API Documentation:** http://localhost:3333/api/docs
- **AI Service Documentation:** http://localhost:8000/docs
- **Web Application:** http://localhost:3000

---

## 🎯 Success Criteria

Your local deployment is successful if:

✅ All 5 Docker containers are running and healthy
✅ API responds at http://localhost:3333
✅ AI Service responds at http://localhost:8000
✅ Web app loads at http://localhost:3000
✅ Can register and login a user
✅ Crawler successfully fetches articles
✅ Articles appear on the web app
✅ Can view article details
✅ AI summaries are generated
✅ Search functionality works
✅ No errors in any service logs

---

## 🚀 Next Steps After Successful Deployment

1. **Customize the UI**
   - Modify components in `apps/web/src/components`
   - Update styling in `apps/web/src/app/globals.css`

2. **Add More News Sources**
   - Create new crawlers in `services/crawler/src/crawlers/`
   - Add source configurations

3. **Test AI Features**
   - Experiment with different summary lengths
   - Test translation between Nepali and English

4. **Prepare for Production**
   - Review security settings
   - Setup production database
   - Configure environment variables for production

---

## 📞 Getting Help

If you encounter issues:

1. Check the error logs in each service
2. Verify all prerequisites are installed correctly
3. Make sure Docker containers are healthy
4. Ensure API keys are correctly set
5. Review the SETUP_GUIDE.md for detailed instructions

Common issues and solutions are in the Troubleshooting section above.

---

**Happy testing! 🇳🇵✨**

Your Nepali News Hub should now be running locally and ready for development and testing!
