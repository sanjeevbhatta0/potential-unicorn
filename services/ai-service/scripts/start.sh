#!/bin/bash
# Start script for AI Service

set -e

echo "Starting AI Service..."

# Check if Redis is running
echo "Checking Redis connection..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Redis is not running. Starting Redis with Docker..."
    docker run -d -p 6379:6379 --name ai-service-redis redis:alpine
    sleep 2
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Please create it from .env.example"
    exit 1
fi

# Start FastAPI server in background
echo "Starting FastAPI server..."
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 &
API_PID=$!

# Wait for API to start
sleep 3

# Start Celery worker
echo "Starting Celery worker..."
poetry run celery -A app.tasks.celery_app worker --loglevel=info -Q summarization,default &
WORKER_PID=$!

echo "AI Service started successfully!"
echo "API PID: $API_PID"
echo "Worker PID: $WORKER_PID"
echo "API docs: http://localhost:8000/docs"

# Handle shutdown
trap "kill $API_PID $WORKER_PID; exit" INT TERM

# Wait for processes
wait
