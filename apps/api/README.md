# Nepali News Hub API

Production-ready NestJS API backend for the Nepali News Hub application.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Articles Management**: Full CRUD operations for news articles with advanced filtering
- **Sources Management**: Manage news sources (websites and YouTube channels)
- **Users Management**: User profiles with preferences and roles
- **Database**: PostgreSQL with TypeORM
- **Documentation**: Swagger/OpenAPI documentation
- **Validation**: Request validation with class-validator
- **Error Handling**: Global exception filters
- **Security**: CORS, helmet, bcrypt password hashing

## Tech Stack

- **NestJS** - Progressive Node.js framework
- **TypeORM** - ORM for TypeScript and JavaScript
- **PostgreSQL** - Relational database
- **Passport JWT** - Authentication middleware
- **Swagger** - API documentation
- **class-validator** - Validation decorators

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- pnpm

## Installation

```bash
# Install dependencies
pnpm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=nepali_news_hub
JWT_SECRET=your-secret-key
```

## Running the app

```bash
# Development mode
pnpm start:dev

# Production mode
pnpm build
pnpm start:prod
```

## API Documentation

Once the application is running, visit:
- Swagger UI: http://localhost:3000/api/docs

## Project Structure

```
src/
├── articles/          # Articles feature module
├── auth/             # Authentication module
├── common/           # Shared utilities (guards, filters, decorators)
├── config/           # Configuration files
├── database/         # Database entities
├── sources/          # News sources module
├── users/            # Users module
├── app.module.ts     # Root module
└── main.ts          # Application entry point
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user

### Articles
- `GET /api/v1/articles` - Get all articles (with filters)
- `GET /api/v1/articles/:id` - Get article by ID
- `POST /api/v1/articles` - Create article (admin only)
- `PATCH /api/v1/articles/:id` - Update article (admin only)
- `DELETE /api/v1/articles/:id` - Delete article (admin only)
- `GET /api/v1/articles/trending` - Get trending articles
- `POST /api/v1/articles/:id/view` - Increment view count

### Sources
- `GET /api/v1/sources` - Get all sources
- `GET /api/v1/sources/:id` - Get source by ID
- `POST /api/v1/sources` - Create source (admin only)
- `PATCH /api/v1/sources/:id` - Update source (admin only)
- `DELETE /api/v1/sources/:id` - Delete source (admin only)

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update current user profile
- `GET /api/v1/users` - Get all users (admin only)
- `GET /api/v1/users/:id` - Get user by ID (admin only)

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## License

MIT
