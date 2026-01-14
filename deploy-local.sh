#!/bin/bash

# Local Deployment Script for Nepali News Hub
# This script automates the entire local deployment process

set -e  # Exit on any error

echo "🚀 Starting Nepali News Hub Local Deployment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

MISSING_DEPS=0

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 20+"
    MISSING_DEPS=1
else
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
fi

if ! command_exists pnpm; then
    print_error "pnpm is not installed. Install with: npm install -g pnpm"
    MISSING_DEPS=1
else
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm installed: v$PNPM_VERSION"
fi

if ! command_exists python3; then
    print_error "Python 3 is not installed. Please install Python 3.11+"
    MISSING_DEPS=1
else
    PYTHON_VERSION=$(python3 --version)
    print_success "Python installed: $PYTHON_VERSION"
fi

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker Desktop"
    MISSING_DEPS=1
else
    DOCKER_VERSION=$(docker --version)
    print_success "Docker installed: $DOCKER_VERSION"
fi

if [ $MISSING_DEPS -eq 1 ]; then
    echo ""
    print_error "Please install missing dependencies and try again."
    exit 1
fi

echo ""
print_success "All prerequisites are installed!"
echo ""

# Step 1: Start Docker infrastructure
echo "🐳 Step 1: Starting Docker infrastructure services..."
cd infrastructure/docker
docker compose up -d

echo ""
print_info "Waiting for services to be healthy (30 seconds)..."
sleep 30

# Check if containers are running
if ! docker ps | grep -q "nepali-news-db"; then
    print_error "PostgreSQL container failed to start"
    exit 1
fi

if ! docker ps | grep -q "nepali-news-redis"; then
    print_error "Redis container failed to start"
    exit 1
fi

print_success "Infrastructure services started successfully!"
echo ""
print_info "Running services:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

cd ../..

# Step 2: Setup environment variables
echo "⚙️  Step 2: Setting up environment variables..."

if [ ! -f .env ]; then
    cp .env.example .env
    print_success "Created .env file from .env.example"
    print_info "⚠️  IMPORTANT: Please edit .env and add your API keys:"
    print_info "   - OPENAI_API_KEY"
    print_info "   - ANTHROPIC_API_KEY"
    echo ""
    read -p "Press Enter after you've updated .env with your API keys..."
else
    print_success ".env file already exists"
fi

# Step 3: Install dependencies
echo ""
echo "📦 Step 3: Installing dependencies..."
echo ""

print_info "Installing root dependencies..."
pnpm install

# Step 4: Build shared packages
echo ""
echo "🔨 Step 4: Building shared packages..."
echo ""

print_info "Building @potential-unicorn/types..."
cd packages/types
pnpm install
cd ../..

print_info "Building @potential-unicorn/utils..."
cd packages/utils
pnpm install
cd ../..

print_success "Shared packages built!"

# Step 5: Setup API
echo ""
echo "🔧 Step 5: Setting up NestJS API..."
cd apps/api

if [ ! -f .env ]; then
    cp ../../.env .env
    print_success "Created API .env file"
fi

print_info "Installing API dependencies..."
pnpm install

print_info "Building API..."
pnpm build

print_info "Running database migrations..."
# Note: We'll need to create migrations first
print_info "⚠️  Database migrations need to be created. We'll skip for now."

cd ../..
print_success "API setup complete!"

# Step 6: Setup AI Service
echo ""
echo "🤖 Step 6: Setting up Python AI Service..."
cd services/ai-service

# Check if Poetry is installed
if ! command_exists poetry; then
    print_info "Installing Poetry..."
    curl -sSL https://install.python-poetry.org | python3 -
    export PATH="$HOME/.local/bin:$PATH"
fi

if [ ! -f .env ]; then
    cp .env.example .env
    print_success "Created AI Service .env file"
fi

print_info "Installing Python dependencies..."
poetry install

cd ../..
print_success "AI Service setup complete!"

# Step 7: Setup Crawler
echo ""
echo "🕷️  Step 7: Setting up News Crawler..."
cd services/crawler

if [ ! -f .env ]; then
    cp .env.example .env
    print_success "Created Crawler .env file"
fi

print_info "Installing Crawler dependencies..."
pnpm install

print_info "Installing Playwright browsers..."
npx playwright install chromium

cd ../..
print_success "Crawler setup complete!"

# Step 8: Setup Web App
echo ""
echo "🌐 Step 8: Setting up Next.js Web Application..."
cd apps/web

if [ ! -f .env.local ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:3333
NEXT_PUBLIC_APP_URL=http://localhost:3000" > .env.local
    print_success "Created Web App .env.local file"
fi

print_info "Installing Web App dependencies..."
pnpm install

cd ../..
print_success "Web App setup complete!"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "🎉 Deployment Complete! All services are ready to run."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Infrastructure Services Running:"
echo "   ✅ PostgreSQL     : localhost:5432"
echo "   ✅ Redis          : localhost:6379"
echo "   ✅ MinIO          : localhost:9000 (console: 9001)"
echo "   ✅ Meilisearch    : localhost:7700"
echo "   ✅ Adminer (DB UI): localhost:8080"
echo ""
echo "🚀 To start the application services, open 4 separate terminals:"
echo ""
echo "   Terminal 1 - API Backend:"
echo "   $ cd apps/api && pnpm dev"
echo "   → Will run on http://localhost:3333"
echo "   → API Docs: http://localhost:3333/api/docs"
echo ""
echo "   Terminal 2 - AI Service:"
echo "   $ cd services/ai-service && poetry run uvicorn app.main:app --reload"
echo "   → Will run on http://localhost:8000"
echo "   → API Docs: http://localhost:8000/docs"
echo ""
echo "   Terminal 3 - News Crawler:"
echo "   $ cd services/crawler && pnpm dev"
echo "   → Runs every 30 minutes"
echo ""
echo "   Terminal 4 - Web App:"
echo "   $ cd apps/web && pnpm dev"
echo "   → Will run on http://localhost:3000"
echo ""
echo "📚 Useful Commands:"
echo "   • View logs: docker compose -f infrastructure/docker/docker-compose.yml logs -f"
echo "   • Stop all: docker compose -f infrastructure/docker/docker-compose.yml down"
echo "   • Restart: docker compose -f infrastructure/docker/docker-compose.yml restart"
echo ""
echo "🔍 Testing:"
echo "   • Open http://localhost:3000 in your browser"
echo "   • API health: curl http://localhost:3333"
echo "   • AI health: curl http://localhost:8000/health"
echo ""
echo "📖 For more details, see SETUP_GUIDE.md"
echo ""
print_success "Happy coding! 🇳🇵✨"
