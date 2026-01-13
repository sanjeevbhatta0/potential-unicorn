# Nepali News Hub (potential-unicorn)

> A modern AI-powered news aggregator for Nepali news with intelligent summarization and a self-service advertisement platform.

## 🎯 Vision

Become the primary gateway for Nepali news online by aggregating content from major news portals and independent creators, presenting them with AI-powered summaries in a modern, engaging user interface.

## ✨ Key Features

### Phase 1: MVP
- **Multi-Source Aggregation:** Crawl and aggregate news from major Nepali news portals and YouTube channels
- **AI-Powered Summaries:** Generate concise 2-3 sentence summaries with key highlights
- **Modern UI:** Perplexity-inspired, mobile-responsive interface
- **Smart Search:** Category filtering, source filtering, and full-text search
- **Real-time Updates:** Fresh content every 15-30 minutes

### Phase 2: Enhanced Features
- **Personalization:** User accounts with reading history and personalized feeds
- **Advanced Search:** Full-text search with typo tolerance
- **Multi-language:** Support for Nepali and English with auto-translation
- **Trending Topics:** AI-powered trending detection

### Phase 3: Monetization
- **Self-Service Ad Platform:** Pixel-based ad pricing similar to Facebook Ads
- **Targeted Advertising:** Geography, demographics, and time-based targeting
- **Analytics Dashboard:** Real-time ad performance metrics
- **Payment Integration:** Khalti, eSewa, Stripe support

### Phase 4: AI Automation
- **AI Agents:** Content moderation, trending detection, quality assurance
- **Automated Operations:** Minimal manual intervention required

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│           Next.js (Web) + React Native (Mobile)    │
├─────────────────────────────────────────────────────┤
│                    API Gateway                      │
├─────────────────────────────────────────────────────┤
│  NestJS API  │  FastAPI (AI)  │  Ad Platform API   │
├─────────────────────────────────────────────────────┤
│  PostgreSQL  │     Redis      │    S3/MinIO        │
└─────────────────────────────────────────────────────┘

Background: Crawler Service + AI Agents + Analytics
```

## 💻 Tech Stack

### Frontend
- **Framework:** Next.js 14+ (React, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand + TanStack Query

### Backend
- **Core API:** NestJS (Node.js + TypeScript)
- **AI Service:** FastAPI (Python)
- **Database:** PostgreSQL 15+ with pgvector
- **Cache/Queue:** Redis
- **Storage:** AWS S3 / MinIO

### AI/ML
- **LLMs:** OpenAI GPT-4 / Anthropic Claude
- **Agents:** LangChain / LangGraph
- **NLP:** Hugging Face Transformers, spaCy

### DevOps
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Hosting:** Vercel (Frontend) + Railway/Render (Backend)
- **Monitoring:** Sentry + Posthog

## 📁 Project Structure

```
potential-unicorn/
├── apps/
│   ├── web/              # Next.js web app
│   ├── admin/            # Admin dashboard
│   ├── api/              # NestJS backend
│   └── mobile/           # React Native app
├── services/
│   ├── crawler/          # News crawler
│   ├── ai-service/       # Python AI service
│   └── ad-platform/      # Ad platform service
├── packages/
│   ├── ui/               # Shared UI components
│   ├── types/            # Shared types
│   ├── utils/            # Shared utilities
│   └── config/           # Shared configs
└── infrastructure/
    ├── docker/           # Docker configs
    └── scripts/          # Deployment scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- pnpm 8+

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/sanjeevbhatta0/potential-unicorn.git
cd potential-unicorn

# Install dependencies
pnpm install

# Start infrastructure services (PostgreSQL, Redis, MinIO)
docker-compose up -d

# Copy environment variables
cp .env.example .env

# Run database migrations
pnpm db:migrate

# Seed initial data
pnpm db:seed

# Start all services in development mode
pnpm dev
```

### Access Points
- **Web App:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3001
- **API:** http://localhost:3333
- **API Docs:** http://localhost:3333/api/docs
- **AI Service:** http://localhost:8000
- **AI Docs:** http://localhost:8000/docs

## 📚 Documentation

- [**Project Plan**](./PROJECT_PLAN.md) - Comprehensive project overview, features, and roadmap
- [**Tech Stack**](./TECH_STACK.md) - Detailed technology stack and dependencies
- [**Folder Structure**](./FOLDER_STRUCTURE.md) - Complete project structure guide
- [**API Documentation**](./docs/API.md) - API endpoints and usage (Coming soon)
- [**Deployment Guide**](./docs/DEPLOYMENT.md) - Production deployment instructions (Coming soon)

## 🗺️ Roadmap

### Q1 2026: MVP Launch
- [ ] Setup project infrastructure
- [ ] Build web crawler for 5-10 major Nepali news sources
- [ ] Implement AI summarization service
- [ ] Develop frontend with basic features
- [ ] Deploy beta version

### Q2 2026: Enhanced Features
- [ ] User authentication and profiles
- [ ] Personalized news feeds
- [ ] Advanced search with Meilisearch/Elasticsearch
- [ ] Mobile app development
- [ ] Performance optimization

### Q3 2026: Monetization
- [ ] Self-service ad platform development
- [ ] Payment gateway integration
- [ ] Ad analytics dashboard
- [ ] A/B testing framework
- [ ] Customer support chatbot

### Q4 2026: AI Automation
- [ ] Content moderation AI agent
- [ ] Trending detection agent
- [ ] Quality assurance agent
- [ ] Ad optimization agent
- [ ] Scale to 100k+ daily users

## 💰 Business Model

### Revenue Streams
1. **Display Advertising (Primary)**
   - Pixel-based pricing: $0.50 per 1000 pixels per hour
   - Premium placements with 2-3x multipliers
   - Targeted ads with audience segmentation

2. **Sponsored Content** (Future)
3. **Premium Subscriptions** (Future)

### Target Market
- Nepali diaspora worldwide
- Local Nepali businesses
- News consumers seeking efficient news consumption
- Small businesses needing affordable advertising

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- Inspired by Perplexity's news interface
- Built with modern, production-ready technologies
- Focused on serving the Nepali community worldwide

## 📞 Contact

- **Project Maintainer:** Sanjeev Bhatta
- **GitHub:** [@sanjeevbhatta0](https://github.com/sanjeevbhatta0)
- **Repository:** [potential-unicorn](https://github.com/sanjeevbhatta0/potential-unicorn)

---

**Status:** Planning & Design Phase 🎨

Let's build something amazing for the Nepali community! 🇳🇵