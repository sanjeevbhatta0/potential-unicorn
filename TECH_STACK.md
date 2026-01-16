# Technology Stack - Detailed Breakdown

## 📦 Monorepo Structure

We'll use a monorepo approach to manage all services in one repository:

```
potential-unicorn/
├── apps/
│   ├── web/                    # Next.js web application
│   ├── mobile/                 # React Native app (Phase 2)
│   ├── admin/                  # Admin dashboard (Next.js)
│   └── api/                    # NestJS backend API
├── services/
│   ├── crawler/                # News crawler service
│   ├── ai-service/             # Python FastAPI AI service
│   └── ad-platform/            # Ad platform service
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Shared utilities
│   └── config/                 # Shared configs
├── infrastructure/
│   ├── docker/                 # Docker configs
│   ├── kubernetes/             # K8s manifests
│   └── terraform/              # Infrastructure as Code
└── docs/                       # Documentation
```

**Tool:** Turborepo or Nx

---

## 🎨 Frontend Stack

### Web Application (apps/web)

**Core Framework:**
```json
{
  "next": "^14.2.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "typescript": "^5.4.0"
}
```

**UI & Styling:**
```json
{
  "tailwindcss": "^3.4.0",
  "@shadcn/ui": "latest",
  "framer-motion": "^11.0.0",
  "lucide-react": "^0.344.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.0"
}
```

**State Management:**
```json
{
  "zustand": "^4.5.0",
  "@tanstack/react-query": "^5.28.0",
  "jotai": "^2.7.0"
}
```

**Forms & Validation:**
```json
{
  "react-hook-form": "^7.51.0",
  "zod": "^3.22.0",
  "@hookform/resolvers": "^3.3.0"
}
```

**Data Fetching:**
```json
{
  "axios": "^1.6.0",
  "swr": "^2.2.0"
}
```

**Internationalization:**
```json
{
  "next-intl": "^3.9.0",
  "react-i18next": "^14.0.0"
}
```

**Analytics & Monitoring:**
```json
{
  "@sentry/nextjs": "^7.102.0",
  "posthog-js": "^1.108.0",
  "react-ga4": "^2.1.0"
}
```

**Dev Tools:**
```json
{
  "eslint": "^8.57.0",
  "prettier": "^3.2.0",
  "husky": "^9.0.0",
  "lint-staged": "^15.2.0"
}
```

### Admin Dashboard (apps/admin)

Same stack as web app, but with additional:
```json
{
  "@tremor/react": "^3.14.0",
  "recharts": "^2.12.0",
  "date-fns": "^3.3.0"
}
```

---

## ⚙️ Backend Stack

### Core API (apps/api - NestJS)

**Framework:**
```json
{
  "@nestjs/core": "^10.3.0",
  "@nestjs/common": "^10.3.0",
  "@nestjs/platform-express": "^10.3.0",
  "reflect-metadata": "^0.2.0",
  "rxjs": "^7.8.0"
}
```

**Database:**
```json
{
  "@nestjs/typeorm": "^10.0.0",
  "typeorm": "^0.3.20",
  "pg": "^8.11.0",
  "@nestjs/config": "^3.2.0"
}
```

**Authentication:**
```json
{
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.0",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.0",
  "passport-local": "^1.0.0",
  "bcrypt": "^5.1.0"
}
```

**Validation:**
```json
{
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.0"
}
```

**Caching & Queue:**
```json
{
  "@nestjs/bull": "^10.1.0",
  "bull": "^4.12.0",
  "@nestjs/cache-manager": "^2.2.0",
  "cache-manager": "^5.4.0",
  "cache-manager-redis-store": "^3.0.0",
  "ioredis": "^5.3.0"
}
```

**Documentation:**
```json
{
  "@nestjs/swagger": "^7.3.0",
  "swagger-ui-express": "^5.0.0"
}
```

**File Upload:**
```json
{
  "@nestjs/platform-multer": "^10.3.0",
  "multer": "^1.4.5",
  "sharp": "^0.33.0",
  "@aws-sdk/client-s3": "^3.515.0"
}
```

**Logging & Monitoring:**
```json
{
  "winston": "^3.11.0",
  "@sentry/node": "^7.102.0",
  "prom-client": "^15.1.0"
}
```

**Testing:**
```json
{
  "@nestjs/testing": "^10.3.0",
  "jest": "^29.7.0",
  "supertest": "^6.3.0"
}
```

---

## 🕷️ Crawler Service (services/crawler)

**Core:**
```json
{
  "playwright": "^1.42.0",
  "cheerio": "^1.0.0",
  "axios": "^1.6.0",
  "crawlee": "^3.7.0"
}
```

**YouTube Integration:**
```json
{
  "googleapis": "^134.0.0",
  "youtube-transcript": "^1.2.0"
}
```

**Scheduling:**
```json
{
  "node-cron": "^3.0.0",
  "bull": "^4.12.0"
}
```

**Language Detection:**
```json
{
  "franc": "^6.2.0",
  "langdetect": "^0.2.0"
}
```

---

## 🤖 AI Service (services/ai-service - Python)

**Framework:**
```python
# requirements.txt
fastapi==0.110.0
uvicorn[standard]==0.27.0
pydantic==2.6.0
python-multipart==0.0.9
```

**LLM Integration:**
```python
openai==1.12.0
anthropic==0.18.0
langchain==0.1.0
langchain-openai==0.0.5
langchain-anthropic==0.1.0
```

**AI Agents:**
```python
langgraph==0.0.20
autogen==0.2.0
crewai==0.1.0
```

**NLP:**
```python
spacy==3.7.0
transformers==4.37.0
sentence-transformers==2.3.0
huggingface-hub==0.20.0
```

**Nepali Language Support:**
```python
nepali==0.3.1
indicnlp==0.91
```

**Task Queue:**
```python
celery==5.3.0
redis==5.0.0
flower==2.0.0  # Celery monitoring
```

**Database:**
```python
sqlalchemy==2.0.0
psycopg2-binary==2.9.0
alembic==1.13.0
```

**Utilities:**
```python
python-dotenv==1.0.0
pydantic-settings==2.1.0
httpx==0.26.0
beautifulsoup4==4.12.0
```

**Testing:**
```python
pytest==8.0.0
pytest-asyncio==0.23.0
pytest-cov==4.1.0
```

---

## 🗄️ Database & Storage

### PostgreSQL

**Version:** 15+

**Extensions:**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "vector";    -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- for better indexing
```

**Connection Pooling:**
- PgBouncer for production

### Redis

**Version:** 7+

**Use Cases:**
- Session storage
- API response caching
- Rate limiting
- Job queues (Bull/BullMQ)
- Real-time data

**Configuration:**
```yaml
maxmemory: 2gb
maxmemory-policy: allkeys-lru
```

### Object Storage

**Options:**
1. **AWS S3** (Production)
2. **MinIO** (Self-hosted, S3-compatible)
3. **Cloudflare R2** (Cost-effective)

**Structure:**
```
buckets/
├── article-images/
│   ├── original/
│   └── optimized/
├── ad-creatives/
├── user-uploads/
└── backups/
```

---

## 🔍 Search Engine (Optional - Phase 2)

### Option 1: Meilisearch (Recommended for MVP)

```yaml
# docker-compose.yml
meilisearch:
  image: getmeili/meilisearch:v1.6
  environment:
    - MEILI_ENV=production
    - MEILI_MASTER_KEY=${MEILI_MASTER_KEY}
```

**Pros:**
- Fast setup
- Typo-tolerant
- Excellent documentation
- Good for Nepali text
- Lower resource usage

### Option 2: Elasticsearch

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
  environment:
    - discovery.type=single-node
    - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
```

**Pros:**
- More powerful
- Advanced analytics
- Better for large scale

**Cons:**
- Higher resource usage
- More complex setup

---

## 🐳 Docker Configuration

### Development (docker-compose.yml)

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_DB: nepali_news
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data

  meilisearch:
    image: getmeili/meilisearch:v1.6
    ports:
      - "7700:7700"
    environment:
      MEILI_ENV: development
    volumes:
      - meili_data:/meili_data

volumes:
  postgres_data:
  redis_data:
  minio_data:
  meili_data:
```

---

## 🚀 Deployment Stack

### Option 1: Cost-Effective Startup Stack

**Frontend:**
- **Vercel** (Free tier, then $20/month)
  - Automatic deployments
  - Edge network
  - Serverless functions

**Backend:**
- **Railway** ($5-20/month)
  - One-click PostgreSQL
  - Redis included
  - Easy deployments

**AI Service:**
- **Railway** or **Render** ($7-15/month)
  - Python support
  - Background workers

**Storage:**
- **Cloudflare R2** ($0.015/GB)
  - S3-compatible
  - No egress fees

**Total: ~$40-60/month**

### Option 2: Scalable Production Stack

**Hosting:**
- **AWS ECS Fargate** or **DigitalOcean App Platform**
  - Containerized deployments
  - Auto-scaling
  - Load balancing

**Database:**
- **AWS RDS PostgreSQL** or **DigitalOcean Managed Database**
  - Automated backups
  - High availability
  - Read replicas

**Caching:**
- **AWS ElastiCache** or **Upstash Redis**

**CDN:**
- **Cloudflare** (Free or $20/month Pro)

**Monitoring:**
- **Sentry** (Free tier, then $26/month)
- **LogRocket** ($99/month)

**Total: ~$200-500/month (depending on traffic)**

### Option 3: Enterprise Stack

**Full AWS Setup:**
- ECS/EKS for containers
- RDS Multi-AZ
- ElastiCache
- S3 + CloudFront
- Route 53
- WAF for security

**Total: ~$1000+/month**

---

## 🔐 Security Tools

```json
{
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.0",
  "express-mongo-sanitize": "^2.2.0",
  "xss-clean": "^0.1.4",
  "hpp": "^0.2.3",
  "cors": "^2.8.5"
}
```

**SSL/TLS:**
- Let's Encrypt (Free)
- Cloudflare SSL

**Secrets Management:**
- AWS Secrets Manager
- Doppler
- Environment variables (development)

---

## 📊 Monitoring & Analytics

### Application Monitoring
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Posthog** - Product analytics

### Infrastructure Monitoring
- **Prometheus + Grafana**
- **Datadog** (if budget allows)
- **Uptime Robot** - Uptime monitoring

### Logging
- **Winston** (Node.js)
- **Structlog** (Python)
- **ELK Stack** (Elasticsearch, Logstash, Kibana) for production

---

## 🧪 Testing Stack

**Frontend:**
```json
{
  "jest": "^29.7.0",
  "@testing-library/react": "^14.2.0",
  "@testing-library/jest-dom": "^6.4.0",
  "cypress": "^13.6.0",
  "playwright": "^1.42.0"
}
```

**Backend:**
```json
{
  "jest": "^29.7.0",
  "@nestjs/testing": "^10.3.0",
  "supertest": "^6.3.0"
}
```

**Python:**
```python
pytest==8.0.0
pytest-asyncio==0.23.0
pytest-mock==3.12.0
```

**Load Testing:**
- k6
- Artillery

---

## 📱 Mobile App (Phase 2)

**Framework:**
```json
{
  "expo": "^50.0.0",
  "react-native": "^0.73.0",
  "react-native-web": "^0.19.0"
}
```

**Navigation:**
```json
{
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/stack": "^6.3.0"
}
```

**State & API:**
```json
{
  "zustand": "^4.5.0",
  "@tanstack/react-query": "^5.28.0",
  "axios": "^1.6.0"
}
```

---

## 🛠️ Development Tools

**Code Quality:**
- ESLint + Prettier
- Husky (git hooks)
- Commitlint
- TypeScript strict mode

**API Development:**
- Postman or Insomnia
- Swagger/OpenAPI

**Database Tools:**
- pgAdmin
- TablePlus
- DBeaver

**Version Control:**
- Git
- GitHub
- Conventional Commits

---

## 💳 Payment Integrations

### Nepal
```javascript
// Khalti
import KhaltiCheckout from "khalti-checkout-web";

// eSewa
// Custom integration
```

### International
```javascript
// Stripe
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

---

## 🌐 CDN & Performance

**CDN:**
- Cloudflare (Primary)
- Bunny CDN (Alternative)

**Image Optimization:**
- Next.js Image component
- Sharp (backend)
- Cloudinary (alternative)

**Performance Monitoring:**
- Google Lighthouse
- WebPageTest
- Chrome DevTools

---

## 📦 Package Management

**Node.js:**
- pnpm (recommended for monorepo)
- npm or yarn

**Python:**
- Poetry (recommended)
- pip + virtualenv

---

## 🔄 CI/CD

**GitHub Actions:**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: # deployment commands
```

---

## 📚 Recommended Learning Path

### For Full Stack Developer
1. **Week 1-2:** Next.js + TypeScript
2. **Week 3-4:** NestJS + PostgreSQL
3. **Week 5:** Docker + DevOps basics
4. **Week 6:** LangChain + AI integration
5. **Week 7:** System design + Architecture

### Resources
- Next.js: https://nextjs.org/learn
- NestJS: https://courses.nestjs.com
- PostgreSQL: https://www.postgresqltutorial.com
- LangChain: https://python.langchain.com/docs
- System Design: https://github.com/donnemartin/system-design-primer

---

This stack is production-ready, scalable, and follows industry best practices while remaining cost-effective for a startup.
