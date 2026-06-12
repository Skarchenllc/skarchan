# Administration Module - Backend API

Comprehensive backend API for managing executive board, legal cases, compliance policies, audits, and strategic initiatives.

## Overview

This module provides a complete administration management system with the following key features:

- **Executive Board Management**: Track board members, C-Suite executives, organizational hierarchy
- **Legal Case Management**: Manage legal matters, litigation, contracts, IP cases
- **Compliance Policy Management**: Maintain compliance policies, versions, and approvals
- **Compliance Audit Management**: Track compliance audits, findings, and action items
- **Strategic Initiative Management**: Monitor strategic projects, KPIs, milestones, and budgets

## Database Schema

### Shared Database
- **Database Name**: `business_management` (shared across all modules)
- **Engine**: PostgreSQL with asyncpg driver
- **ORM**: SQLAlchemy with async support
- **Query Style**: Raw SQL using `text()` for all database operations

### Tables

#### 1. executive_board
Board of Directors and C-Suite executives
- id (UUID)
- member_name, position, department
- email, phone
- start_date, end_date, status
- bio, photo_url
- reports_to_id (self-referential FK)
- timestamps

#### 2. legal_cases
Legal matters and cases
- id (UUID)
- case_number (unique), case_title
- case_type, status, priority
- plaintiff, defendant, court_name
- assigned_counsel, external_counsel
- case_value (decimal)
- filing_date, hearing_date, resolution_date
- outcome, description
- documents (JSONB)
- timestamps

#### 3. compliance_policies
Compliance policies and procedures
- id (UUID)
- policy_code (unique), policy_name
- category, version, status
- effective_date, review_date, expiry_date
- owner, approver
- description, policy_document_url
- scope (JSONB)
- timestamps

#### 4. compliance_audits
Compliance audits and assessments
- id (UUID)
- audit_number (unique), audit_title
- audit_type, policy_id (FK)
- status, risk_level
- auditor_name
- audit_date, completion_date
- findings (JSONB), recommendations
- action_items (JSONB), score
- timestamps

#### 5. strategic_initiatives
Strategic plans and initiatives
- id (UUID)
- initiative_code (unique), initiative_name
- category, status, priority
- owner, champion
- start_date, target_completion_date, actual_completion_date
- budget_allocated, budget_spent
- progress_percentage
- objectives, kpis, milestones, risks (all JSONB)
- description
- timestamps

## API Endpoints

Base URL: `http://localhost:8000/api/v1`

### Executive Board
- `GET /executive-board` - List all members (filters: position, status, department, search)
- `GET /executive-board/{id}` - Get member by ID
- `POST /executive-board` - Create new member
- `PUT /executive-board/{id}` - Update member
- `DELETE /executive-board/{id}` - Delete member
- `GET /executive-board/stats/overview` - Get statistics

### Legal Cases
- `GET /legal-cases` - List all cases (filters: case_type, status, priority, search)
- `GET /legal-cases/{id}` - Get case by ID
- `POST /legal-cases` - Create new case
- `PUT /legal-cases/{id}` - Update case
- `DELETE /legal-cases/{id}` - Delete case
- `GET /legal-cases/stats/overview` - Get statistics

### Compliance Policies
- `GET /compliance-policies` - List all policies (filters: category, status, search)
- `GET /compliance-policies/{id}` - Get policy by ID
- `POST /compliance-policies` - Create new policy
- `PUT /compliance-policies/{id}` - Update policy
- `DELETE /compliance-policies/{id}` - Delete policy
- `GET /compliance-policies/stats/overview` - Get statistics

### Compliance Audits
- `GET /compliance-audits` - List all audits (filters: audit_type, status, risk_level, search)
- `GET /compliance-audits/{id}` - Get audit by ID
- `POST /compliance-audits` - Create new audit
- `PUT /compliance-audits/{id}` - Update audit
- `DELETE /compliance-audits/{id}` - Delete audit
- `GET /compliance-audits/stats/overview` - Get statistics

### Strategic Initiatives
- `GET /strategic-initiatives` - List all initiatives (filters: category, status, priority, search)
- `GET /strategic-initiatives/{id}` - Get initiative by ID
- `POST /strategic-initiatives` - Create new initiative
- `PUT /strategic-initiatives/{id}` - Update initiative
- `DELETE /strategic-initiatives/{id}` - Delete initiative
- `GET /strategic-initiatives/stats/overview` - Get statistics

## Response Format

All list endpoints wrap arrays in objects:
```json
{
  "executive_board": [...],
  "total": 10
}
```

## Installation & Setup

### Prerequisites
- Python 3.11+
- PostgreSQL 14+
- pip

### Quick Start

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Configure database:**
Edit `.env` file or set environment variables:
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/business_management
```

3. **Run the application:**
```bash
./run.sh
```

Or manually:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4. **Seed sample data:**
```bash
python seed_data.py
```

### Sample Data

The seed script creates:
- **10 Executive Board Members**: CEO, CFO, COO, CTO, CHRO, CMO, General Counsel, and Board Members
- **15 Legal Cases**: Mix of litigation, contracts, IP, employment, and regulatory cases
- **15 Compliance Policies**: Data protection, financial, health & safety, environmental, ethics policies
- **10 Compliance Audits**: Internal, external, regulatory, and certification audits
- **12 Strategic Initiatives**: Growth, efficiency, innovation, transformation, and risk management initiatives

## API Documentation

Once running, access interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Technology Stack

- **Framework**: FastAPI 0.109.0
- **Server**: Uvicorn 0.27.0
- **Database**: PostgreSQL with asyncpg 0.29.0
- **ORM**: SQLAlchemy 2.0.25 (async)
- **Validation**: Pydantic 2.5.3
- **Configuration**: pydantic-settings 2.1.0

## Architecture Patterns

### Database Patterns
- All database operations use raw SQL with `text()`
- JSONB fields use `CAST(:param AS jsonb)` syntax
- UUID fields use `CAST(:param AS uuid)` syntax
- Async/await throughout
- Session management with proper cleanup

### Code Organization
```
backend/
├── app/
│   ├── core/
│   │   ├── config.py          # Settings & configuration
│   │   └── database.py        # Database connection & Base
│   ├── models/                # SQLAlchemy models
│   │   ├── executive_board.py
│   │   ├── legal_case.py
│   │   ├── compliance_policy.py
│   │   ├── compliance_audit.py
│   │   └── strategic_initiative.py
│   ├── api/
│   │   └── endpoints/         # API route handlers
│   │       ├── executive_board.py
│   │       ├── legal_cases.py
│   │       ├── compliance_policies.py
│   │       ├── compliance_audits.py
│   │       └── strategic_initiatives.py
│   └── main.py                # Application entry point
├── requirements.txt
├── Dockerfile.dev
├── run.sh
└── seed_data.py
```

## Environment Variables

```bash
# Application
APP_NAME="Administration API"
VERSION="1.0.0"
DEBUG=True

# Database
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/business_management"

# API
API_V1_PREFIX="/api/v1"

# CORS
CORS_ORIGINS=["*"]
```

## Development

### Running Tests
```bash
pytest
```

### Code Style
- Follow PEP 8
- Use type hints
- Document functions with docstrings
- Keep functions focused and small

## Docker Support

### Build and Run
```bash
docker build -f Dockerfile.dev -t admin-api .
docker run -p 8000:8000 admin-api
```

## Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "service": "Administration API",
  "version": "1.0.0"
}
```

## Security Considerations

- Input validation via Pydantic
- SQL injection protection via parameterized queries
- CORS configured (adjust for production)
- Environment-based configuration
- No hardcoded credentials

## Common Issues

### Database Connection Errors
- Ensure PostgreSQL is running
- Verify DATABASE_URL is correct
- Check network connectivity

### Import Errors
- Ensure all dependencies are installed
- Activate virtual environment
- Check Python version (3.11+)

## License

Internal use only - Company confidential

## Support

For issues or questions, contact the development team.
