#!/bin/bash

# Production Operations Module - Quick Start Script

echo "===================================================="
echo "Production Operations Module - Quick Start"
echo "===================================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please update .env file with your database credentials"
fi

# Check if Docker is running
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        echo ""
        echo "Docker is available. Would you like to start services with Docker? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo "Starting Docker services..."
            docker-compose up -d
            echo ""
            echo "Waiting for services to be ready..."
            sleep 5

            echo ""
            echo "Would you like to seed the database with sample data? (y/n)"
            read -r seed_response
            if [[ "$seed_response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
                echo "Seeding database..."
                python seed_data.py
            fi
        fi
    fi
fi

echo ""
echo "===================================================="
echo "Starting FastAPI application..."
echo "===================================================="
echo ""
echo "API will be available at:"
echo "  - http://localhost:8000"
echo "  - Swagger UI: http://localhost:8000/docs"
echo "  - ReDoc: http://localhost:8000/redoc"
echo ""

# Run the application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
