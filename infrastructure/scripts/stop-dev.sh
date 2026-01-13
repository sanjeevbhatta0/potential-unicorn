#!/bin/bash

# Stop development environment for Nepali News Hub

set -e

echo "🛑 Stopping Nepali News Hub Development Environment..."

# Navigate to docker directory
cd "$(dirname "$0")/../docker"

# Stop Docker services
docker-compose down

echo "✅ Development environment stopped!"
echo ""
echo "💡 To remove all data volumes, run:"
echo "   docker-compose down -v"
echo ""
