#!/bin/bash

# Start development environment for Nepali News Hub

set -e

echo "🚀 Starting Nepali News Hub Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Navigate to docker directory
cd "$(dirname "$0")/../docker"

# Start Docker services
echo "📦 Starting Docker services (PostgreSQL, Redis, MinIO, Meilisearch)..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

# Create MinIO bucket if it doesn't exist
echo "📁 Creating MinIO bucket..."
sleep 2
docker run --rm --network=nepali-news-network \
  --entrypoint=/bin/sh \
  minio/mc:latest \
  -c "mc alias set myminio http://minio:9000 minioadmin minioadmin123 && \
      mc mb myminio/nepali-news --ignore-existing && \
      mc anonymous set download myminio/nepali-news"

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "📍 Access points:"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo "   - MinIO Console: http://localhost:9001"
echo "   - MinIO API: http://localhost:9000"
echo "   - Meilisearch: http://localhost:7700"
echo "   - Adminer (DB UI): http://localhost:8080"
echo ""
echo "🔐 Credentials:"
echo "   - PostgreSQL: postgres / postgres123"
echo "   - Redis: redis123"
echo "   - MinIO: minioadmin / minioadmin123"
echo ""
echo "💡 Next steps:"
echo "   1. Copy .env.example to .env and update values"
echo "   2. Run 'pnpm install' to install dependencies"
echo "   3. Run 'pnpm dev' to start all services"
echo ""
