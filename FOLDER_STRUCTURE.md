# Project Folder Structure

This document outlines the complete folder structure for the Nepali News Aggregator project.

## 📁 Complete Directory Tree

```
potential-unicorn/
│
├── .github/                              # GitHub configuration
│   ├── workflows/                        # CI/CD workflows
│   │   ├── ci.yml                       # Continuous Integration
│   │   ├── deploy-production.yml        # Production deployment
│   │   └── deploy-staging.yml           # Staging deployment
│   ├── ISSUE_TEMPLATE/                  # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md         # PR template
│
├── apps/                                 # Application packages
│   │
│   ├── web/                             # Next.js web application
│   │   ├── public/                      # Static files
│   │   │   ├── images/
│   │   │   ├── fonts/
│   │   │   └── favicon.ico
│   │   ├── src/
│   │   │   ├── app/                     # App Router (Next.js 14+)
│   │   │   │   ├── (auth)/             # Auth routes group
│   │   │   │   │   ├── login/
│   │   │   │   │   └── register/
│   │   │   │   ├── (main)/             # Main app routes
│   │   │   │   │   ├── page.tsx        # Home page
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── articles/
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── categories/
│   │   │   │   │   │   └── [category]/
│   │   │   │   │   ├── search/
│   │   │   │   │   └── trending/
│   │   │   │   └── api/                # API routes
│   │   │   │       ├── auth/
│   │   │   │       └── health/
│   │   │   ├── components/             # React components
│   │   │   │   ├── ui/                 # shadcn/ui components
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   └── ...
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   └── Sidebar.tsx
│   │   │   │   ├── features/
│   │   │   │   │   ├── articles/
│   │   │   │   │   │   ├── ArticleCard.tsx
│   │   │   │   │   │   ├── ArticleList.tsx
│   │   │   │   │   │   ├── ArticleDetail.tsx
│   │   │   │   │   │   └── ArticleSkeleton.tsx
│   │   │   │   │   ├── search/
│   │   │   │   │   │   ├── SearchBar.tsx
│   │   │   │   │   │   └── SearchResults.tsx
│   │   │   │   │   ├── categories/
│   │   │   │   │   └── trending/
│   │   │   │   └── shared/
│   │   │   │       ├── LoadingSpinner.tsx
│   │   │   │       ├── ErrorBoundary.tsx
│   │   │   │       └── InfiniteScroll.tsx
│   │   │   ├── lib/                    # Utilities & config
│   │   │   │   ├── api/
│   │   │   │   │   ├── client.ts
│   │   │   │   │   └── endpoints.ts
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useArticles.ts
│   │   │   │   │   ├── useAuth.ts
│   │   │   │   │   └── useInfiniteScroll.ts
│   │   │   │   ├── utils/
│   │   │   │   │   ├── cn.ts           # Class name utility
│   │   │   │   │   ├── format.ts
│   │   │   │   │   └── constants.ts
│   │   │   │   └── store/              # State management
│   │   │   │       ├── authStore.ts
│   │   │   │       ├── articleStore.ts
│   │   │   │       └── uiStore.ts
│   │   │   ├── styles/
│   │   │   │   └── globals.css
│   │   │   └── types/
│   │   │       ├── article.ts
│   │   │       ├── user.ts
│   │   │       └── api.ts
│   │   ├── .env.local                  # Environment variables
│   │   ├── .env.example
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── admin/                           # Admin dashboard
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── articles/
│   │   │   │   ├── sources/
│   │   │   │   ├── users/
│   │   │   │   ├── ads/
│   │   │   │   └── analytics/
│   │   │   ├── components/
│   │   │   │   ├── charts/
│   │   │   │   ├── tables/
│   │   │   │   └── forms/
│   │   │   └── lib/
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── api/                             # NestJS backend
│   │   ├── src/
│   │   │   ├── main.ts                 # Application entry point
│   │   │   ├── app.module.ts           # Root module
│   │   │   ├── auth/                   # Authentication module
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   └── local.strategy.ts
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   └── roles.guard.ts
│   │   │   │   └── dto/
│   │   │   │       ├── login.dto.ts
│   │   │   │       └── register.dto.ts
│   │   │   ├── articles/               # Articles module
│   │   │   │   ├── articles.module.ts
│   │   │   │   ├── articles.controller.ts
│   │   │   │   ├── articles.service.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── article.entity.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-article.dto.ts
│   │   │   │   │   ├── update-article.dto.ts
│   │   │   │   │   └── query-articles.dto.ts
│   │   │   │   └── repositories/
│   │   │   │       └── article.repository.ts
│   │   │   ├── sources/                # News sources module
│   │   │   │   ├── sources.module.ts
│   │   │   │   ├── sources.controller.ts
│   │   │   │   ├── sources.service.ts
│   │   │   │   └── entities/
│   │   │   │       └── source.entity.ts
│   │   │   ├── users/                  # Users module
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── entities/
│   │   │   │       └── user.entity.ts
│   │   │   ├── ads/                    # Advertisement module
│   │   │   │   ├── ads.module.ts
│   │   │   │   ├── ads.controller.ts
│   │   │   │   ├── ads.service.ts
│   │   │   │   ├── entities/
│   │   │   │   │   ├── ad-space.entity.ts
│   │   │   │   │   ├── ad-campaign.entity.ts
│   │   │   │   │   └── ad-placement.entity.ts
│   │   │   │   └── dto/
│   │   │   ├── analytics/              # Analytics module
│   │   │   │   └── ...
│   │   │   ├── common/                 # Shared resources
│   │   │   │   ├── decorators/
│   │   │   │   ├── filters/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── pipes/
│   │   │   │   └── middleware/
│   │   │   ├── config/                 # Configuration
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── jwt.config.ts
│   │   │   │   └── app.config.ts
│   │   │   └── database/               # Database files
│   │   │       ├── migrations/
│   │   │       └── seeds/
│   │   ├── test/                       # E2E tests
│   │   │   ├── app.e2e-spec.ts
│   │   │   └── jest-e2e.json
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── mobile/                          # React Native app (Phase 2)
│       ├── app/
│       ├── components/
│       ├── screens/
│       ├── navigation/
│       ├── services/
│       ├── utils/
│       ├── app.json
│       └── package.json
│
├── services/                            # Microservices
│   │
│   ├── crawler/                         # News crawler service
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── crawlers/               # Individual crawlers
│   │   │   │   ├── base.crawler.ts
│   │   │   │   ├── onlinekhabar.crawler.ts
│   │   │   │   ├── ekantipur.crawler.ts
│   │   │   │   ├── setopati.crawler.ts
│   │   │   │   ├── ratopati.crawler.ts
│   │   │   │   ├── bbc-nepali.crawler.ts
│   │   │   │   └── youtube.crawler.ts
│   │   │   ├── processors/             # Data processors
│   │   │   │   ├── article.processor.ts
│   │   │   │   ├── deduplicator.ts
│   │   │   │   └── image.processor.ts
│   │   │   ├── schedulers/
│   │   │   │   └── cron.scheduler.ts
│   │   │   ├── queue/
│   │   │   │   ├── producer.ts
│   │   │   │   └── consumer.ts
│   │   │   ├── config/
│   │   │   │   └── sources.config.ts
│   │   │   └── utils/
│   │   │       ├── logger.ts
│   │   │       ├── retry.ts
│   │   │       └── sanitize.ts
│   │   ├── .env
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── ai-service/                      # Python AI service
│   │   ├── app/
│   │   │   ├── main.py                 # FastAPI entry point
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── v1/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── summarize.py
│   │   │   │   │   ├── translate.py
│   │   │   │   │   ├── classify.py
│   │   │   │   │   └── embeddings.py
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── config.py
│   │   │   │   ├── logger.py
│   │   │   │   └── exceptions.py
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── summarizer.py
│   │   │   │   ├── translator.py
│   │   │   │   ├── classifier.py
│   │   │   │   └── embeddings.py
│   │   │   ├── agents/                 # AI agents
│   │   │   │   ├── __init__.py
│   │   │   │   ├── moderator.py
│   │   │   │   ├── trending.py
│   │   │   │   ├── quality_assurance.py
│   │   │   │   └── base_agent.py
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── article.py
│   │   │   │   └── summary.py
│   │   │   ├── utils/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── text_utils.py
│   │   │   │   └── cache.py
│   │   │   └── tasks/                  # Celery tasks
│   │   │       ├── __init__.py
│   │   │       ├── celery_app.py
│   │   │       └── summarize_task.py
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   ├── test_summarizer.py
│   │   │   └── test_agents.py
│   │   ├── .env
│   │   ├── requirements.txt
│   │   ├── pyproject.toml             # Poetry config
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   └── ad-platform/                     # Ad platform service
│       ├── src/
│       │   ├── index.ts
│       │   ├── controllers/
│       │   │   ├── campaign.controller.ts
│       │   │   ├── placement.controller.ts
│       │   │   └── analytics.controller.ts
│       │   ├── services/
│       │   │   ├── bidding.service.ts
│       │   │   ├── targeting.service.ts
│       │   │   └── analytics.service.ts
│       │   ├── models/
│       │   └── utils/
│       ├── tsconfig.json
│       └── package.json
│
├── packages/                            # Shared packages
│   │
│   ├── ui/                             # Shared UI components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Button/
│   │   │   │   ├── Card/
│   │   │   │   └── Input/
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── types/                          # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── article.ts
│   │   │   ├── user.ts
│   │   │   ├── ad.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── utils/                          # Shared utilities
│   │   ├── src/
│   │   │   ├── date.ts
│   │   │   ├── string.ts
│   │   │   ├── validation.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── config/                         # Shared configuration
│       ├── eslint-config/
│       │   ├── index.js
│       │   └── package.json
│       ├── typescript-config/
│       │   ├── base.json
│       │   ├── nextjs.json
│       │   ├── react.json
│       │   └── package.json
│       └── tailwind-config/
│           ├── index.js
│           └── package.json
│
├── infrastructure/                      # Infrastructure as Code
│   │
│   ├── docker/
│   │   ├── docker-compose.yml          # Development environment
│   │   ├── docker-compose.prod.yml     # Production environment
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.crawler
│   │   └── Dockerfile.ai-service
│   │
│   ├── kubernetes/                     # K8s manifests (if needed)
│   │   ├── deployments/
│   │   │   ├── web.yaml
│   │   │   ├── api.yaml
│   │   │   └── crawler.yaml
│   │   ├── services/
│   │   │   ├── web-service.yaml
│   │   │   └── api-service.yaml
│   │   ├── configmaps/
│   │   ├── secrets/
│   │   └── ingress.yaml
│   │
│   ├── terraform/                      # Terraform configs (if using AWS/GCP)
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── modules/
│   │       ├── database/
│   │       ├── storage/
│   │       └── networking/
│   │
│   └── scripts/                        # Deployment scripts
│       ├── deploy.sh
│       ├── backup.sh
│       ├── restore.sh
│       └── setup-dev.sh
│
├── docs/                               # Documentation
│   ├── API.md                         # API documentation
│   ├── ARCHITECTURE.md                # Architecture overview
│   ├── DEPLOYMENT.md                  # Deployment guide
│   ├── DEVELOPMENT.md                 # Development guide
│   ├── CONTRIBUTING.md                # Contribution guidelines
│   └── diagrams/                      # Architecture diagrams
│       ├── system-architecture.png
│       ├── database-schema.png
│       └── data-flow.png
│
├── scripts/                            # Utility scripts
│   ├── seed-database.ts               # Database seeding
│   ├── generate-types.ts              # Type generation
│   └── check-health.ts                # Health check script
│
├── .husky/                            # Git hooks
│   ├── pre-commit
│   ├── pre-push
│   └── commit-msg
│
├── .vscode/                           # VSCode settings
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
│
├── .env.example                       # Environment variables template
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── docker-compose.yml                 # Root docker-compose
├── turbo.json                         # Turborepo config
├── pnpm-workspace.yaml                # pnpm workspace config
├── package.json                       # Root package.json
├── README.md                          # Main README
├── PROJECT_PLAN.md                    # Project plan document
├── TECH_STACK.md                      # Tech stack document
├── FOLDER_STRUCTURE.md                # This file
└── LICENSE
```

## 📝 File Naming Conventions

### TypeScript/JavaScript
- **Components:** PascalCase (e.g., `ArticleCard.tsx`)
- **Utilities:** camelCase (e.g., `formatDate.ts`)
- **Constants:** UPPER_SNAKE_CASE or camelCase (e.g., `API_BASE_URL` or `apiEndpoints.ts`)
- **Types:** PascalCase (e.g., `Article.ts`, `User.ts`)
- **Hooks:** camelCase with `use` prefix (e.g., `useArticles.ts`)

### Python
- **Modules:** snake_case (e.g., `summarizer.py`)
- **Classes:** PascalCase (e.g., `ArticleSummarizer`)
- **Functions:** snake_case (e.g., `generate_summary()`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `API_KEY`)

### CSS
- **Classes:** kebab-case (e.g., `article-card`)
- **IDs:** kebab-case (e.g., `main-header`)

## 🎯 Key Directory Purposes

### `/apps`
Contains all deployable applications. Each app is independently deployable.

### `/services`
Contains microservices that run as separate processes. These handle specific tasks like crawling and AI processing.

### `/packages`
Shared code that can be imported by apps and services. Promotes code reuse.

### `/infrastructure`
Everything related to deployment, DevOps, and infrastructure management.

### `/docs`
Comprehensive documentation for the project.

## 📦 Package Organization

Each package in `/packages` should be independently publishable and follow this structure:

```
package-name/
├── src/
│   ├── index.ts          # Main entry point
│   └── ...
├── tests/
├── tsconfig.json
├── package.json
└── README.md
```

## 🔄 Import Paths

With monorepo setup, imports look like:

```typescript
// In web app
import { Article } from '@potential-unicorn/types'
import { formatDate } from '@potential-unicorn/utils'
import { Button } from '@potential-unicorn/ui'

// In API
import type { ArticleDTO } from '@potential-unicorn/types'
```

## 🛠️ Development Workflow

1. **Start services:** `pnpm dev` (starts all apps/services)
2. **Work on specific app:** `pnpm --filter web dev`
3. **Run tests:** `pnpm test`
4. **Build all:** `pnpm build`
5. **Lint:** `pnpm lint`

## 📌 Best Practices

1. **Keep it modular:** Each module should have a single responsibility
2. **Shared code in packages:** Don't duplicate code across apps
3. **Consistent naming:** Follow conventions across the project
4. **Documentation:** README in each major directory
5. **Type safety:** Use TypeScript everywhere possible
6. **Testing:** Co-locate tests with source files or in dedicated test directories

---

This structure supports:
- Easy navigation
- Code reusability
- Independent deployment
- Scalability
- Team collaboration
- Maintainability
