# Project Management Backend API

FastAPI-based backend service for the Project Management module.

## Features

- FastAPI with async/await support
- PostgreSQL database with SQLAlchemy ORM
- Redis for caching
- Universal Custom Fields & Workflows API
- Docker support for development

## Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   └── endpoints/      # API route handlers
│   ├── core/
│   │   ├── config.py       # Application settings
│   │   └── database.py     # Database configuration
│   ├── models/             # SQLAlchemy models
│   ├── schemas/            # Pydantic schemas
│   ├── services/           # Business logic layer
│   ├── shared/
│   │   └── universal_fields_api.py  # Shared custom fields & workflows
│   └── main.py            # Application entry point
├── requirements.txt       # Python dependencies
├── Dockerfile.dev        # Development Docker configuration
└── .env.example          # Environment variables template
```

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the application:**
   ```bash
   uvicorn app.main:app --reload
   ```

## Docker Development

```bash
docker build -f Dockerfile.dev -t pm-backend .
docker run -p 8000:8000 pm-backend
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Main API
- `GET /api/v1/` - API root endpoint

### Universal Fields & Workflows
- `GET /api/v1/custom-fields/definitions` - List custom field definitions
- `POST /api/v1/custom-fields/definitions` - Create custom field
- `GET /api/v1/workflows` - List workflow rules
- `POST /api/v1/workflows` - Create workflow rule

## Module Configuration

- **Module Name:** `pm` (project-management)
- **API Title:** Project Management API
- **Description:** Project planning, tracking, and resource management
- **Default Port:** 8000

## Database

- Uses shared PostgreSQL database: `business_management`
- Async SQLAlchemy with asyncpg driver
- Automatic table creation on startup

## Environment Variables

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/business_management
REDIS_URL=redis://redis:6379
SECRET_KEY=your-secret-key-change-in-production
ALLOWED_ORIGINS=["http://localhost:3000"]
```
