# Supply Chain Management (SCM) Backend

FastAPI backend for the Supply Chain Management module, handling procurement, inventory, logistics, and vendor management.

## Features

- **FastAPI Framework**: Modern, fast web framework for building APIs
- **Async Database**: SQLAlchemy with asyncpg for PostgreSQL
- **Universal Fields**: Shared custom fields and workflows system
- **Docker Support**: Development Dockerfile included
- **CORS Enabled**: Cross-origin resource sharing configured

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── endpoints/       # API endpoint definitions
│   ├── core/
│   │   ├── config.py        # Configuration settings
│   │   └── database.py      # Database connection
│   ├── models/
│   │   └── custom_field.py  # Database models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   ├── shared/
│   │   └── universal_fields_api.py  # Shared custom fields API
│   └── main.py              # FastAPI application entry point
├── requirements.txt         # Python dependencies
├── Dockerfile.dev           # Development Docker configuration
└── .env.example             # Environment variables template
```

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Redis (optional)

### Installation

1. **Clone the repository** (if not already done)

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run the application**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

## Docker Development

### Build and run with Docker:

```bash
docker build -f Dockerfile.dev -t scm-backend .
docker run -p 8000:8000 scm-backend
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Key Endpoints

### Health Check
- `GET /health` - Check service health

### API Routes
- `GET /api/v1/` - API root endpoint

### Universal Fields & Workflows
- `GET /api/v1/custom-fields/definitions` - List custom field definitions
- `POST /api/v1/custom-fields/definitions` - Create custom field
- `GET /api/v1/workflows` - List workflows
- `POST /api/v1/workflows` - Create workflow

## Environment Variables

See `.env.example` for all available configuration options:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SECRET_KEY`: JWT secret key
- `ALLOWED_ORIGINS`: CORS allowed origins
- `OPENAI_API_KEY`: OpenAI API key (optional)
- `ANTHROPIC_API_KEY`: Anthropic API key (optional)

## Database

The module uses a shared database with other modules. Custom fields are stored in the `crm_custom_field_definitions` table, which is shared across all modules.

## Development

### Running Tests
```bash
pytest
```

### Code Style
```bash
black app/
flake8 app/
```

## License

Proprietary - All rights reserved
