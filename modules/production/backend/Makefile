.PHONY: help install dev seed clean test docker-up docker-down docker-logs

help:
	@echo "Production Operations Module - Makefile Commands"
	@echo "================================================"
	@echo "make install     - Install Python dependencies"
	@echo "make dev         - Run development server"
	@echo "make seed        - Seed database with sample data"
	@echo "make clean       - Clean Python cache files"
	@echo "make test        - Run tests"
	@echo "make docker-up   - Start Docker services"
	@echo "make docker-down - Stop Docker services"
	@echo "make docker-logs - View Docker logs"

install:
	pip install -r requirements.txt

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

seed:
	python seed_data.py

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +

test:
	pytest

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f api

docker-build:
	docker-compose up -d --build
