# Getting Started - Implementation Guide

This guide will walk you through setting up the development environment and starting implementation of the Nepali News Hub.

## 🎯 Phase 1: Initial Setup (Week 1)

### Step 1: Initialize Monorepo Structure

```bash
# Create the base structure
mkdir -p apps/{web,admin,api} services/{crawler,ai-service,ad-platform} packages/{ui,types,utils,config} infrastructure/{docker,scripts} docs

# Initialize pnpm workspace
cat > pnpm-workspace.yaml << EOF
packages:
  - 'apps/*'
  - 'services/*'
  - 'packages/*'
EOF

# Create root package.json
cat > package.json << EOF
{
  "name": "potential-unicorn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean && rm -rf node_modules",
    "db:migrate": "cd apps/api && pnpm typeorm migration:run",
    "db:seed": "cd apps/api && pnpm seed"
  },
  "devDependencies": {
    "turbo": "^1.12.0",
    "typescript": "^5.4.0",
    "prettier": "^3.2.0",
    "eslint": "^8.57.0"
  }
}
EOF

# Install Turborepo
pnpm install
```

### Step 2: Setup Docker Infrastructure

Create `infrastructure/docker/docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg15
    container_name: nepali-news-db
    environment:
      POSTGRES_DB: nepali_news_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: nepali-news-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass redis123
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: nepali-news-minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  meilisearch:
    image: getmeili/meilisearch:v1.6
    container_name: nepali-news-search
    ports:
      - "7700:7700"
    environment:
      MEILI_ENV: development
      MEILI_NO_ANALYTICS: "true"
    volumes:
      - meili_data:/meili_data

volumes:
  postgres_data:
  redis_data:
  minio_data:
  meili_data:

networks:
  default:
    name: nepali-news-network
```

Start the infrastructure:
```bash
cd infrastructure/docker
docker-compose up -d
```

### Step 3: Setup Next.js Web App

```bash
cd apps
pnpm create next-app@latest web --typescript --tailwind --app --src-dir --import-alias "@/*"
cd web

# Install additional dependencies
pnpm add @tanstack/react-query zustand axios date-fns clsx tailwind-merge
pnpm add -D @types/node

# Install shadcn/ui
pnpm dlx shadcn-ui@latest init
```

Configure `apps/web/next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
  },
}

module.exports = nextConfig
```

Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3333
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Setup NestJS API

```bash
cd apps
pnpm i -g @nestjs/cli
nest new api

cd api

# Install dependencies
pnpm add @nestjs/config @nestjs/typeorm @nestjs/jwt @nestjs/passport
pnpm add @nestjs/bull bull @nestjs/cache-manager cache-manager
pnpm add typeorm pg bcrypt passport passport-jwt passport-local
pnpm add class-validator class-transformer
pnpm add @nestjs/swagger swagger-ui-express
pnpm add ioredis

pnpm add -D @types/bcrypt @types/passport-jwt @types/passport-local
```

Create `apps/api/.env`:
```env
NODE_ENV=development
PORT=3333

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres123
DATABASE_NAME=nepali_news_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d

# External Services
AI_SERVICE_URL=http://localhost:8000

# MinIO/S3
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=nepali-news

# Search
MEILISEARCH_HOST=http://localhost:7700
```

### Step 5: Setup Python AI Service

```bash
cd services
mkdir ai-service
cd ai-service

# Create pyproject.toml for Poetry
cat > pyproject.toml << EOF
[tool.poetry]
name = "ai-service"
version = "0.1.0"
description = "AI summarization service for Nepali news"
authors = ["Your Name <your.email@example.com>"]

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.110.0"
uvicorn = {extras = ["standard"], version = "^0.27.0"}
pydantic = "^2.6.0"
pydantic-settings = "^2.1.0"
python-multipart = "^0.0.9"
openai = "^1.12.0"
anthropic = "^0.18.0"
langchain = "^0.1.0"
langchain-openai = "^0.0.5"
langchain-anthropic = "^0.1.0"
celery = "^5.3.0"
redis = "^5.0.0"
httpx = "^0.26.0"
beautifulsoup4 = "^4.12.0"
sqlalchemy = "^2.0.0"
psycopg2-binary = "^2.9.0"

[tool.poetry.dev-dependencies]
pytest = "^8.0.0"
pytest-asyncio = "^0.23.0"
black = "^24.0.0"
ruff = "^0.2.0"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"
EOF

# Install Poetry (if not already installed)
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install

# Create main.py
mkdir app
cat > app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Nepali News AI Service",
    description="AI-powered summarization and processing for Nepali news",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Nepali News AI Service", "status": "operational"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF

# Create .env
cat > .env << EOF
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/nepali_news_dev
REDIS_URL=redis://:redis123@localhost:6379/0
EOF
```

### Step 6: Setup Shared Packages

Create `packages/types/package.json`:
```json
{
  "name": "@potential-unicorn/types",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

Create `packages/types/src/index.ts`:
```typescript
export interface Article {
  id: string;
  sourceId: string;
  title: string;
  titleEn?: string;
  content: string;
  summary: string;
  summaryEn?: string;
  highlights: string[];
  url: string;
  imageUrl?: string;
  author?: string;
  publishedAt: Date;
  category: string;
  tags: string[];
  language: 'ne' | 'en';
  viewCount: number;
  isTrending: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsSource {
  id: string;
  name: string;
  type: 'website' | 'youtube';
  baseUrl?: string;
  channelId?: string;
  logoUrl?: string;
  language: 'ne' | 'en';
  isActive: boolean;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'advertiser' | 'admin';
  preferences: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdCampaign {
  id: string;
  advertiserId: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  startTime: Date;
  endTime: Date;
  targeting: {
    geography?: string[];
    demographics?: Record<string, any>;
    interests?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Step 7: Configure Turborepo

Create `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

## 🔧 Development Commands

After setup, use these commands:

```bash
# Start all services
pnpm dev

# Start specific service
pnpm --filter web dev
pnpm --filter api dev

# Run Python AI service
cd services/ai-service
poetry run uvicorn app.main:app --reload

# Build for production
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

## 📝 Week 2-3: News Crawler Development

### Identify Target News Sources

**Major Nepali News Portals:**
1. Online Khabar - https://www.onlinekhabar.com
2. eKantipur - https://ekantipur.com
3. Setopati - https://www.setopati.com
4. Ratopati - https://ratopati.com
5. Nepali Times - https://www.nepalitimes.com
6. BBC Nepali - https://www.bbc.com/nepali
7. Himalayan Times - https://thehimalayantimes.com

**YouTube Channels:**
1. Kantipur TV HD
2. Setopati Online
3. AP1 HD Television
4. Nepal Television

### Create Base Crawler

Create `services/crawler/src/crawlers/base.crawler.ts`:

```typescript
import * as cheerio from 'cheerio';
import axios from 'axios';

export interface CrawlResult {
  title: string;
  content: string;
  url: string;
  imageUrl?: string;
  author?: string;
  publishedAt: Date;
  category?: string;
}

export abstract class BaseCrawler {
  protected sourceId: string;
  protected sourceName: string;

  constructor(sourceId: string, sourceName: string) {
    this.sourceId = sourceId;
    this.sourceName = sourceName;
  }

  abstract crawl(): Promise<CrawlResult[]>;

  protected async fetchHtml(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NepaliNewsBot/1.0)',
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      throw error;
    }
  }

  protected parseHtml(html: string) {
    return cheerio.load(html);
  }

  protected cleanText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }
}
```

### Example Crawler Implementation

Create `services/crawler/src/crawlers/onlinekhabar.crawler.ts`:

```typescript
import { BaseCrawler, CrawlResult } from './base.crawler';

export class OnlineKhabarCrawler extends BaseCrawler {
  private baseUrl = 'https://www.onlinekhabar.com';

  constructor() {
    super('onlinekhabar', 'Online Khabar');
  }

  async crawl(): Promise<CrawlResult[]> {
    const html = await this.fetchHtml(this.baseUrl);
    const $ = this.parseHtml(html);
    const articles: CrawlResult[] = [];

    // Adjust selectors based on actual website structure
    $('.ok-post-loop-each').each((_, element) => {
      const $el = $(element);

      const title = this.cleanText($el.find('.ok-post-title').text());
      const url = $el.find('a').attr('href') || '';
      const imageUrl = $el.find('img').attr('src');

      if (title && url) {
        articles.push({
          title,
          content: '', // Will be filled by detailed scrape
          url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
          imageUrl,
          publishedAt: new Date(),
          category: 'general',
        });
      }
    });

    return articles;
  }

  async crawlArticleDetail(url: string): Promise<Partial<CrawlResult>> {
    const html = await this.fetchHtml(url);
    const $ = this.parseHtml(html);

    const content = this.cleanText($('.ok-news-post-content').text());
    const author = this.cleanText($('.ok-author-name').text());

    return { content, author };
  }
}
```

## 🤖 Week 4-5: AI Summarization

Create `services/ai-service/app/services/summarizer.py`:

```python
from anthropic import Anthropic
from typing import Dict, List
import os

class ArticleSummarizer:
    def __init__(self):
        self.client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    async def summarize(self, article_text: str, language: str = "ne") -> Dict[str, any]:
        prompt = f"""
        Summarize this Nepali news article in 2-3 sentences.
        Extract 3-5 key highlights (important names, places, events, dates).

        Article:
        {article_text}

        Return your response in JSON format:
        {{
            "summary": "brief summary in {language}",
            "highlights": ["point 1", "point 2", "point 3"]
        }}
        """

        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        # Parse and return JSON response
        import json
        return json.loads(response.content[0].text)
```

## 🎨 Week 6-8: Frontend Development

### Key Pages to Build

1. **Home Page** (`apps/web/src/app/page.tsx`)
   - News feed with infinite scroll
   - Category tabs
   - Trending section

2. **Article Detail** (`apps/web/src/app/articles/[id]/page.tsx`)
   - Full article display
   - Summary highlights
   - Related articles
   - Share buttons

3. **Search** (`apps/web/src/app/search/page.tsx`)
   - Search bar
   - Filters (source, category, date)
   - Search results

4. **Category Pages** (`apps/web/src/app/categories/[category]/page.tsx`)
   - Category-specific feed

## 🧪 Testing Strategy

### Unit Tests
```bash
# Backend
cd apps/api
pnpm test

# Frontend
cd apps/web
pnpm test
```

### Integration Tests
```bash
# API E2E tests
cd apps/api
pnpm test:e2e
```

### Load Testing
```bash
# Install k6
brew install k6  # or appropriate package manager

# Run load test
k6 run infrastructure/scripts/load-test.js
```

## 🚀 Deployment Checklist

### Before Going Live
- [ ] Security audit
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Error tracking setup (Sentry)
- [ ] Analytics setup (Posthog)
- [ ] Backup strategy
- [ ] Monitoring setup
- [ ] SSL certificate
- [ ] Domain setup
- [ ] Environment variables configured

## 📚 Next Steps

After completing Phase 1:
1. Gather user feedback
2. Monitor performance metrics
3. Plan Phase 2 features
4. Begin monetization strategy

## 🆘 Common Issues & Solutions

**Issue: Docker containers won't start**
```bash
docker-compose down -v
docker-compose up -d
```

**Issue: Port already in use**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

**Issue: Database connection failed**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
psql -h localhost -U postgres -d nepali_news_dev
```

## 📞 Getting Help

- Check documentation in `/docs`
- Review GitHub issues
- Contact project maintainer

---

Ready to start building? Begin with Step 1 and work your way through the guide!
