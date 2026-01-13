# Nepali News Aggregator - Comprehensive Project Plan

## 📋 Executive Summary

**Project Name:** Nepali News Hub (potential-unicorn)
**Vision:** Become the primary gateway for Nepali news online with AI-powered summarization and a modern, engaging user experience.
**Monetization:** Self-service advertisement platform with pixel-based pricing and targeted audience selection.

---

## 🎯 Core Features

### Phase 1: MVP (Minimum Viable Product)
1. **News Aggregation**
   - Web scraping from major Nepali news portals
   - YouTube API integration for video-based news
   - Automated crawling every 15-30 minutes
   - Duplicate detection and deduplication

2. **AI-Powered Summarization**
   - Extract key points from articles
   - Generate 2-3 sentence summaries
   - Highlight important details (names, places, events, dates)
   - Support for Nepali and English content

3. **Modern User Interface**
   - Perplexity-style news feed
   - Category filtering (Politics, Sports, Entertainment, Business, etc.)
   - Source filtering
   - Search functionality
   - Mobile-responsive design

4. **Article Management**
   - Link to original source
   - Image extraction and display
   - Publication timestamp
   - Source attribution

### Phase 2: Enhanced Features
1. **User Accounts & Personalization**
   - User registration/login
   - Reading history
   - Bookmarks/saved articles
   - Personalized news feed
   - Topic preferences

2. **Advanced Search & Discovery**
   - Full-text search
   - Trending topics
   - Related articles
   - Topic clustering

3. **Multi-language Support**
   - Nepali Unicode
   - English
   - Auto-translation between languages

### Phase 3: Monetization Platform
1. **Self-Service Ad Platform**
   - Business dashboard
   - Pixel-based ad placement (similar to The Million Dollar Homepage)
   - Time-based pricing (hourly, daily, weekly rates)
   - Audience targeting:
     - Geography (Nepal regions, diaspora)
     - Demographics (age, interests)
     - Time of day
     - Device type
   - Ad analytics dashboard
   - Payment integration (Khalti, eSewa, international cards)

2. **Ad Management**
   - Real-time bidding for premium slots
   - Ad performance metrics
   - A/B testing capabilities
   - Fraud detection

### Phase 4: AI Automation
1. **AI Agents**
   - Content moderation agent
   - Trending topic detection agent
   - Quality assurance agent
   - Customer support chatbot
   - Ad approval agent
   - Performance monitoring agent

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │  Mobile App  │  │ Admin Panel  │     │
│  │  (Next.js)   │  │ (React Native│  │  (Next.js)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │    API Gateway    │
                    │    (Kong/NGINX)   │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  Core API      │  │  AI Service     │  │  Ad Platform    │
│  (Node.js/     │  │  (Python        │  │  API            │
│   NestJS)      │  │   FastAPI)      │  │  (Node.js)      │
└───────┬────────┘  └────────┬────────┘  └────────┬────────┘
        │                    │                     │
        └────────────────────┼─────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│   PostgreSQL   │  │   Redis         │  │   S3/MinIO     │
│   (Primary DB) │  │   (Cache/Queue) │  │   (Images)     │
└────────────────┘  └─────────────────┘  └────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Background Services                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  News       │  │  AI         │  │  Analytics  │        │
│  │  Crawler    │  │  Processor  │  │  Service    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack Recommendation

### Frontend
**Web Application:**
- **Framework:** Next.js 14+ (React)
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand or TanStack Query
- **Language:** TypeScript
- **Animation:** Framer Motion

**Why?**
- Next.js provides SSR/SSG for SEO optimization
- Fast page loads with automatic code splitting
- Excellent developer experience
- Built-in API routes

**Mobile Application (Optional - Phase 2):**
- React Native with Expo
- Shared business logic with web

### Backend

**Core API:**
- **Framework:** NestJS (Node.js + TypeScript)
- **API Style:** RESTful + GraphQL (optional)
- **Authentication:** JWT + Passport.js
- **Validation:** class-validator + class-transformer

**Why NestJS?**
- Enterprise-grade architecture
- TypeScript-first
- Built-in dependency injection
- Excellent documentation
- Microservices-ready

**AI/ML Service:**
- **Framework:** FastAPI (Python)
- **ML Libraries:**
  - Hugging Face Transformers (summarization)
  - LangChain (AI agents)
  - OpenAI API / Anthropic Claude API
  - spaCy (NLP for Nepali text)
- **Task Queue:** Celery + Redis

**Why Python for AI?**
- Best ecosystem for AI/ML
- Excellent Nepali NLP libraries
- FastAPI is modern and fast
- Easy integration with AI services

### Database & Storage

**Primary Database:**
- **PostgreSQL 15+**
  - Robust and reliable
  - Excellent full-text search
  - JSON support for flexible schemas
  - pgvector for semantic search

**Caching & Queue:**
- **Redis**
  - Session management
  - API response caching
  - Rate limiting
  - Background job queue (BullMQ)

**File Storage:**
- **AWS S3** or **MinIO** (self-hosted S3 alternative)
  - Article images
  - Ad creatives
  - User uploads

**Search Engine (Optional - Phase 2):**
- **Elasticsearch** or **Meilisearch**
  - Fast full-text search
  - Typo tolerance
  - Faceted search

### Web Scraping

**Crawler:**
- **Playwright** or **Puppeteer** (for JavaScript-heavy sites)
- **Cheerio** (for static HTML)
- **Scrapy** (Python alternative, more robust)
- **Crawlee** (modern Node.js crawler framework)

**YouTube Integration:**
- YouTube Data API v3
- Transcript extraction (youtube-transcript-api)

### AI/LLM Integration

**Summarization:**
- **Option 1:** OpenAI GPT-4 API (easy, expensive)
- **Option 2:** Anthropic Claude API (good quality, reasonable pricing)
- **Option 3:** Self-hosted models:
  - Llama 3.1 (8B/70B) via Ollama
  - Mistral-7B
  - Fine-tuned models for Nepali

**AI Agents:**
- **LangChain** or **LangGraph**
- **AutoGen** (Microsoft)
- **CrewAI**

### DevOps & Infrastructure

**Containerization:**
- Docker + Docker Compose (development)
- Kubernetes (production scaling)

**CI/CD:**
- GitHub Actions
- Automated testing
- Automated deployments

**Hosting:**
- **Option 1 (Cost-effective):**
  - DigitalOcean Droplets/App Platform
  - Vercel (frontend)
  - Railway (backend)

- **Option 2 (Scalable):**
  - AWS (EC2, ECS, Lambda)
  - Cloudflare (CDN)

- **Option 3 (Balanced):**
  - Render.com (backend services)
  - Vercel (frontend)
  - Supabase (PostgreSQL + Auth)

**Monitoring:**
- Sentry (error tracking)
- LogRocket or Posthog (user analytics)
- Prometheus + Grafana (infrastructure monitoring)
- Uptime Robot (uptime monitoring)

### Payment Integration
- **Khalti** (Nepal)
- **eSewa** (Nepal)
- **Stripe** (international)
- **PayPal** (optional)

---

## 🗄️ Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user', -- user, advertiser, admin
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- News Sources
CREATE TABLE news_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- website, youtube
    base_url VARCHAR(500),
    channel_id VARCHAR(255), -- for YouTube
    logo_url VARCHAR(500),
    language VARCHAR(10) DEFAULT 'ne',
    is_active BOOLEAN DEFAULT true,
    crawl_config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Articles
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES news_sources(id),
    title TEXT NOT NULL,
    title_en TEXT, -- English translation
    content TEXT,
    summary TEXT, -- AI-generated summary
    summary_en TEXT,
    highlights JSONB DEFAULT '[]', -- Important points
    url VARCHAR(1000) UNIQUE NOT NULL,
    image_url VARCHAR(1000),
    author VARCHAR(255),
    published_at TIMESTAMP,
    category VARCHAR(100),
    tags VARCHAR(100)[],
    language VARCHAR(10) DEFAULT 'ne',
    view_count INTEGER DEFAULT 0,
    is_trending BOOLEAN DEFAULT false,
    embedding VECTOR(1536), -- for semantic search (pgvector)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_trending ON articles(is_trending, published_at DESC);

-- User Activity
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- view, bookmark, share
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bookmarks
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, article_id)
);

-- Ad Spaces (Pixel-based grid)
CREATE TABLE ad_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    x_position INTEGER NOT NULL, -- grid position
    y_position INTEGER NOT NULL,
    width INTEGER NOT NULL, -- in pixels
    height INTEGER NOT NULL,
    is_premium BOOLEAN DEFAULT false,
    base_rate_per_hour DECIMAL(10, 2) DEFAULT 10.00,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(x_position, y_position, width, height)
);

-- Ad Campaigns
CREATE TABLE ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed
    budget DECIMAL(10, 2) NOT NULL,
    spent DECIMAL(10, 2) DEFAULT 0,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    targeting JSONB DEFAULT '{}', -- audience targeting rules
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ad Placements
CREATE TABLE ad_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    ad_space_id UUID REFERENCES ad_spaces(id),
    creative_url VARCHAR(1000) NOT NULL, -- S3 URL
    link_url VARCHAR(1000), -- click-through URL
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ad_placements_active ON ad_placements(start_time, end_time)
    WHERE start_time <= NOW() AND end_time >= NOW();

-- Ad Analytics
CREATE TABLE ad_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID REFERENCES ad_placements(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- impression, click
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_agent TEXT,
    ip_address INET,
    referrer VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ad_analytics_placement ON ad_analytics(placement_id, created_at);
```

---

## 🚀 Implementation Roadmap

### Phase 1: MVP (2-3 months)

**Week 1-2: Project Setup & Infrastructure**
- Initialize monorepo structure (Turborepo or Nx)
- Setup development environment (Docker Compose)
- Configure PostgreSQL, Redis
- Setup CI/CD pipeline
- Create basic deployment scripts

**Week 3-4: News Crawler Development**
- Identify 5-10 major Nepali news sources
- Build web scrapers for each source
- YouTube API integration
- Schedule crawler jobs (every 15-30 min)
- Implement duplicate detection

**Week 5-6: AI Summarization Service**
- Setup FastAPI service
- Integrate with OpenAI/Claude API
- Build summarization pipeline:
  1. Content extraction
  2. Language detection
  3. Summary generation
  4. Highlight extraction
- Implement retry logic and error handling
- Add caching for processed articles

**Week 7-8: Core Backend API**
- Setup NestJS project
- Implement authentication (JWT)
- Build REST endpoints:
  - GET /articles (with pagination, filters)
  - GET /articles/:id
  - GET /sources
  - GET /categories
  - Search endpoint
- Rate limiting
- API documentation (Swagger)

**Week 9-10: Frontend Development**
- Setup Next.js project
- Design system with Tailwind + shadcn/ui
- Build core pages:
  - Home page (news feed)
  - Article detail page
  - Category pages
  - Search page
- Implement infinite scroll
- Mobile responsive design
- Dark mode support

**Week 11: Integration & Testing**
- Frontend-backend integration
- End-to-end testing
- Performance optimization
- SEO optimization
- Cross-browser testing

**Week 12: Beta Launch**
- Deploy to staging environment
- User testing
- Bug fixes
- Production deployment
- Monitoring setup

### Phase 2: Enhanced Features (2-3 months)

**Month 4:**
- User authentication & profiles
- Bookmarking system
- Reading history
- Personalized feed algorithm
- Email notifications
- Social sharing features

**Month 5:**
- Advanced search (Elasticsearch/Meilisearch)
- Trending topics algorithm
- Related articles recommendation
- Topic clustering
- Multi-language support improvements
- Mobile app (React Native) - optional

**Month 6:**
- Performance optimization
- Caching strategies
- Database optimization
- Load testing
- Security audit
- Analytics dashboard (internal)

### Phase 3: Monetization Platform (3-4 months)

**Month 7-8:**
- Ad platform backend:
  - Ad space management
  - Campaign creation API
  - Targeting engine
  - Bidding system
  - Payment integration (Khalti, eSewa)
- Advertiser dashboard frontend
- Ad placement algorithm
- Analytics tracking

**Month 9-10:**
- Self-service ad creation flow
- Ad approval workflow
- Payment processing
- Invoice generation
- Ad performance analytics
- A/B testing framework
- Fraud detection basic rules

**Month 10-11:**
- Advanced targeting options
- Real-time bidding
- Ad optimization suggestions
- Budget management tools
- Reporting dashboard
- API for programmatic ads

### Phase 4: AI Automation (Ongoing)

**Month 12+:**
- Content moderation AI agent
- Automated trending detection
- Quality assurance agent
- Customer support chatbot
- Automated ad approval
- Performance monitoring agent
- Predictive analytics
- Recommendation engine improvements

---

## 🤖 AI/ML Components

### 1. Article Summarization
```python
# Pseudo-code for summarization
def summarize_article(article_text, language='ne'):
    # Use Claude or GPT-4 for summarization
    prompt = f"""
    Summarize this Nepali news article in 2-3 sentences.
    Extract 3-5 key highlights (names, places, important details).

    Article:
    {article_text}

    Return JSON:
    {{
        "summary": "brief summary",
        "highlights": ["point 1", "point 2", ...]
    }}
    """

    response = claude_api.generate(prompt)
    return parse_json(response)
```

### 2. AI Agents Architecture

**Content Moderation Agent:**
- Scans new articles for inappropriate content
- Flags potential misinformation
- Checks for duplicate content
- Runs every 5 minutes

**Trending Detection Agent:**
- Analyzes article view patterns
- Identifies emerging topics
- Updates trending status
- Runs every hour

**Quality Assurance Agent:**
- Validates scraper output
- Checks summary quality
- Monitors API health
- Sends alerts for issues
- Runs continuously

**Customer Support Agent:**
- LangChain-based chatbot
- Answers advertiser questions
- Handles common issues
- Escalates complex problems

**Ad Optimization Agent:**
- Analyzes ad performance
- Suggests bid adjustments
- Recommends audience targeting
- Predicts campaign success

### 3. Recommendation Engine
- Collaborative filtering for user preferences
- Content-based filtering using embeddings
- Hybrid approach for best results
- Real-time personalization

---

## 🔒 Production Considerations

### Security
1. **Authentication & Authorization**
   - JWT with refresh tokens
   - Rate limiting on all endpoints
   - CORS configuration
   - XSS protection
   - CSRF tokens

2. **Data Protection**
   - Encrypt sensitive data at rest
   - HTTPS everywhere
   - Secure password hashing (bcrypt)
   - PII data handling compliance

3. **API Security**
   - API key management
   - Input validation
   - SQL injection prevention
   - DDoS protection (Cloudflare)

### Scalability
1. **Horizontal Scaling**
   - Stateless API design
   - Load balancer (NGINX/Kong)
   - Database replication
   - Redis cluster

2. **Caching Strategy**
   - CDN for static assets (Cloudflare)
   - Redis for API responses
   - Browser caching headers
   - Edge caching for articles

3. **Database Optimization**
   - Proper indexing
   - Query optimization
   - Connection pooling
   - Read replicas for heavy read operations

### Performance
1. **Frontend**
   - Code splitting
   - Image optimization (Next.js Image)
   - Lazy loading
   - Service workers for offline support

2. **Backend**
   - Response compression (gzip)
   - Database query optimization
   - Async processing for heavy tasks
   - Batch operations where possible

3. **Monitoring**
   - Application Performance Monitoring (APM)
   - Error tracking (Sentry)
   - Uptime monitoring
   - Cost monitoring

### Reliability
1. **Backup Strategy**
   - Daily database backups
   - S3 versioning for files
   - Disaster recovery plan
   - Regular backup testing

2. **Error Handling**
   - Graceful degradation
   - Circuit breakers for external APIs
   - Retry logic with exponential backoff
   - Dead letter queues

3. **High Availability**
   - Multi-region deployment (future)
   - Health checks
   - Automatic failover
   - 99.9% uptime SLA

---

## 💰 Monetization Strategy

### Revenue Streams

1. **Display Advertising (Primary)**
   - Pixel-based pricing: $0.10-$1.00 per 100x100 pixel per hour
   - Premium placements: 2-3x base rate
   - Targeted ads: 1.5-2x base rate
   - Volume discounts for longer commitments

2. **Sponsored Content (Future)**
   - Native advertising slots
   - Sponsored article highlights
   - Newsletter sponsorships

3. **Premium Subscriptions (Future)**
   - Ad-free experience
   - Early access to breaking news
   - Advanced bookmarking features
   - Email digests

### Pricing Model

**Ad Platform Pricing:**
```
Base Rate: $0.50 per 1000 pixels per hour
Example: 200x200 pixel ad = 40,000 pixels
Cost for 24 hours = (40,000 / 1000) * $0.50 * 24 = $480

Multipliers:
- Homepage placement: 2x
- Above-the-fold: 1.5x
- Targeted (region): 1.3x
- Targeted (demographics): 1.5x
- Peak hours (6-10 PM): 1.2x
```

**Payment Options:**
- Prepaid credits
- Auto-recharge when balance low
- Monthly invoicing for large advertisers

---

## 📊 Success Metrics

### Product Metrics
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Articles published per day
- Average session duration
- Bounce rate
- Return visitor rate

### Business Metrics
- Ad inventory fill rate
- Average ad price
- Revenue per user
- Customer acquisition cost (CAC)
- Lifetime value (LTV)
- Ad CTR (Click-Through Rate)

### Technical Metrics
- API response time (p95, p99)
- Crawler success rate
- AI summarization quality score
- System uptime
- Error rate
- Database query performance

---

## 🎨 Design Principles

### User Experience
1. **Speed:** Sub-second page loads
2. **Simplicity:** Clean, uncluttered interface
3. **Engagement:** Infinite scroll, smooth animations
4. **Accessibility:** WCAG 2.1 compliance
5. **Mobile-first:** Responsive across all devices

### Visual Design (Inspired by Perplexity)
- Clean typography (Inter, Noto Sans Nepali)
- Generous whitespace
- Card-based layouts
- Subtle animations
- Dark/light mode
- Color-coded categories

---

## 🌍 Competitive Advantages

1. **AI-Powered Summaries:** Save users time
2. **Multi-Source Aggregation:** One-stop shop for all Nepali news
3. **Modern UX:** Better than traditional news sites
4. **Self-Service Ads:** Easy for small businesses to advertise
5. **Transparent Pricing:** No hidden costs
6. **Targeted Reach:** Reach Nepali diaspora worldwide

---

## ⚠️ Challenges & Mitigations

### Challenge 1: Web Scraping Legal Issues
**Mitigation:**
- Review each site's robots.txt and ToS
- Implement respectful crawling (rate limits)
- Always link back to original source
- Consider reaching out for partnerships

### Challenge 2: Nepali Language NLP
**Mitigation:**
- Use multilingual models (GPT-4, Claude)
- Fine-tune on Nepali corpus if needed
- Leverage existing Nepali NLP libraries
- Start with English content if Nepali quality is low

### Challenge 3: Initial Traffic
**Mitigation:**
- SEO optimization from day one
- Social media marketing
- Partner with influencers
- Content marketing (blog about Nepali news trends)
- Reddit, Facebook groups engagement

### Challenge 4: Ad Platform Adoption
**Mitigation:**
- Start with manual sales to 10-20 businesses
- Offer free trials
- Create case studies
- Simple onboarding process
- Customer support

### Challenge 5: Content Freshness
**Mitigation:**
- Real-time crawling (every 15 min)
- WebSocket for live updates
- Push notifications for breaking news
- Trending section always fresh

---

## 📚 Learning Resources

### For Development Team
1. **Next.js:** https://nextjs.org/docs
2. **NestJS:** https://docs.nestjs.com
3. **LangChain:** https://python.langchain.com/docs
4. **Web Scraping:** https://scrapy.org
5. **System Design:** "Designing Data-Intensive Applications" by Martin Kleppmann

---

## 🎯 Next Steps

1. **Validate the idea:**
   - Survey potential users (Nepali community)
   - Interview potential advertisers
   - Analyze competitor sites

2. **Start with MVP:**
   - Pick 5 news sources to start
   - Build basic scraper + UI
   - Test with friends/family
   - Iterate based on feedback

3. **Build in public:**
   - Share progress on Twitter/LinkedIn
   - Create a landing page for early access
   - Build email list

4. **Technical Setup:**
   - Setup development environment
   - Create initial project structure
   - Deploy "Coming Soon" page

**Would you like me to start implementing the technical foundation?**
