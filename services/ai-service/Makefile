.PHONY: help install dev test lint format clean run worker docker-up docker-down

help:
	@echo "AI Service - Available commands:"
	@echo "  make install      Install dependencies with Poetry"
	@echo "  make dev          Install dev dependencies"
	@echo "  make test         Run tests"
	@echo "  make lint         Run linters"
	@echo "  make format       Format code"
	@echo "  make clean        Clean temporary files"
	@echo "  make run          Run FastAPI server"
	@echo "  make worker       Run Celery worker"
	@echo "  make docker-up    Start Docker services"
	@echo "  make docker-down  Stop Docker services"

install:
	poetry install --no-dev

dev:
	poetry install

test:
	poetry run pytest -v --cov=app --cov-report=html --cov-report=term

lint:
	poetry run ruff check app/
	poetry run mypy app/

format:
	poetry run black app/
	poetry run ruff check --fix app/

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.log" -delete
	rm -rf .pytest_cache
	rm -rf .coverage
	rm -rf htmlcov
	rm -rf dist
	rm -rf build
	rm -rf *.egg-info

run:
	poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

worker:
	poetry run celery -A app.tasks.celery_app worker --loglevel=info -Q summarization,default

beat:
	poetry run celery -A app.tasks.celery_app beat --loglevel=info

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-build:
	docker-compose build

redis:
	docker run -d -p 6379:6379 --name ai-service-redis redis:alpine

requirements:
	poetry export -f requirements.txt --output requirements.txt --without-hashes
