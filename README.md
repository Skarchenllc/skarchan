# Business Management Platform

A comprehensive, modular business management platform with microservices architecture. Each business function is a standalone project that connects to a centralized dashboard.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Centralized Dashboard                      │
│                     (Port 3000/8001)                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway (Port 4000)                 │
│         Routes requests to appropriate microservices         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────┬──────────────┬─────────────┬─────────────────┐
│  Accounting │     Sales    │      HR     │   Legal/R&D     │
│   (3001)    │    (3003)    │   (3004)    │  (3005/3006)    │
└─────────────┴──────────────┴─────────────┴─────────────────┘
       ↓              ↓              ↓              ↓
┌─────────────────────────────────────────────────────────────┐
│           Shared Infrastructure & Databases                  │
│  PostgreSQL (5432) | Redis (6379) | ChromaDB (8000)         │
└─────────────────────────────────────────────────────────────┘
```

## Modules

### Core Infrastructure
- **API Gateway** (Port 4000) - Routes requests, WebSocket, real-time events
- **Shared Libraries** - Common types, utilities, and components
- **Database Layer** - PostgreSQL, Redis, ChromaDB

### Business Modules

| Module | Frontend Port | Backend Port | Description |
|--------|--------------|--------------|-------------|
| **Dashboard** | 3000 | 8001 | Central hub with real-time monitoring, widgets, and AI analytics |
| **Accounting & Finance** | 3001 | 8002 | Financial management, transactions, reports, budgets |
| **Administration** | 3002 | 8003 | User management, roles, permissions, system settings |
| **Sales & Marketing** | 3003 | 8004 | CRM, leads, campaigns, sales pipeline |
| **Human Resources** | 3004 | 8005 | Employee management, payroll, attendance, benefits |
| **Legal & Compliance** | 3005 | 8006 | Contracts, documents, compliance, audits |
| **Research & Development** | 3006 | 8007 | R&D projects, innovation, knowledge management |

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.3+
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Auth**: NextAuth.js with JWT

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Async Support**: asyncio, async/await throughout
- **ORM**: SQLAlchemy 2.0 (async)
- **Validation**: Pydantic 2.7
- **Database Driver**: asyncpg (PostgreSQL)
- **Auth**: JWT with python-jose, bcrypt password hashing
- **Caching**: Redis
- **AI/ML**: LangChain, OpenAI, Anthropic APIs
- **Vector DB**: ChromaDB
- **Server**: Uvicorn (ASGI)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Vector Store**: ChromaDB
- **Reverse Proxy**: API Gateway (Express.js)
- **Real-time**: Socket.IO

## Quick Start with Docker

### Prerequisites
- Docker & Docker Compose installed
- Git

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd systems
```

### Step 2: Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your configuration (optional for development)
# nano .env
```

### Step 3: Start All Services

```bash
# Build and start all services in detached mode
docker-compose up -d --build

# This will start:
# - PostgreSQL (Database)
# - Redis (Cache)
# - ChromaDB (Vector Store)
# - API Gateway
# - All module frontends and backends
```

### Step 4: Verify Services

```bash
# Check all containers are running
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f dashboard-frontend
```

### Step 5: Access the Platform

#### Frontend Applications
- **Dashboard**: http://localhost:3000
- **Accounting & Finance**: http://localhost:3001
- **Administration**: http://localhost:3002
- **Sales & Marketing**: http://localhost:3003
- **Human Resources**: http://localhost:3004
- **Legal & Compliance**: http://localhost:3005
- **Research & Development**: http://localhost:3006

#### Backend API Documentation (Swagger/ReDoc)
- **API Gateway**: http://localhost:4000
- **Dashboard API**: http://localhost:8001/docs
- **Accounting API**: http://localhost:8002/docs
- **Administration API**: http://localhost:8003/docs
- **Sales API**: http://localhost:8004/docs
- **HR API**: http://localhost:8005/docs
- **Legal API**: http://localhost:8006/docs
- **R&D API**: http://localhost:8007/docs

#### Database Services
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **ChromaDB**: http://localhost:8000

### Step 6: Default Credentials

```
Email: admin@example.com
Password: admin123
```

**⚠️ IMPORTANT: Change these credentials in production!**

### Step 7: Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean database)
docker-compose down -v
```

## Development Setup

### Option 1: Using Docker (Recommended)

```bash
# Start all services
docker-compose up

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up --build

# Clean everything
docker-compose down -v
```

### Option 2: Local Development

#### Backend (each module)

```bash
cd modules/<module-name>/backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env

# Run the server
uvicorn app.main:app --reload --port 800X
```

#### Frontend (each module)

```bash
cd modules/<module-name>/frontend
npm install
cp .env.example .env.local
# Edit .env.local

# Run dev server
npm run dev
```

#### API Gateway

```bash
cd infrastructure/api-gateway
npm install
cp .env.example .env
# Edit .env

npm run dev
```

#### Shared Libraries

```bash
# Build shared types
cd shared/types
npm install
npm run build

# Build shared utils
cd ../utils
npm install
npm run build
```

## Project Structure

```
systems/
├── modules/                          # Business modules
│   ├── dashboard/                    # Central dashboard
│   │   ├── frontend/                 # Next.js app
│   │   │   ├── src/
│   │   │   │   ├── app/             # Next.js pages
│   │   │   │   ├── components/      # React components
│   │   │   │   └── lib/             # Utilities
│   │   │   ├── package.json
│   │   │   └── Dockerfile.dev
│   │   └── backend/                  # FastAPI app
│   │       ├── app/
│   │       │   ├── api/             # API endpoints
│   │       │   ├── models/          # SQLAlchemy models
│   │       │   ├── schemas/         # Pydantic schemas
│   │       │   ├── services/        # Business logic
│   │       │   └── core/            # Config, DB, Auth
│   │       ├── requirements.txt
│   │       └── Dockerfile.dev
│   ├── accounting-finance/           # Accounting module
│   ├── administration/               # Admin module
│   ├── sales-marketing/              # Sales & CRM module
│   ├── human-resources/              # HR module
│   ├── legal-compliance/             # Legal module
│   └── research-development/         # R&D module
│
├── infrastructure/                   # Infrastructure services
│   ├── api-gateway/                  # Express.js gateway
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   └── databases/                    # DB init scripts
│       └── init-scripts/
│           └── 01-init-database.sql
│
├── shared/                           # Shared libraries
│   ├── types/                        # TypeScript types
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── utils/                        # Utility functions
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   └── components/                   # Shared React components
│
├── docker-compose.yml                # Docker orchestration
├── package.json                      # Root package.json (workspace)
├── .env.example                      # Environment template
├── .gitignore
└── README.md                         # This file
```

## Key Features

### 1. Microservices Architecture
- Each module is independent and can be deployed separately
- Modules communicate via API Gateway
- Scalable and maintainable

### 2. Real-time Communication
- WebSocket support through API Gateway
- Socket.IO for bidirectional communication
- Live dashboard updates
- Real-time notifications

### 3. AI Integration
- LangChain for AI workflows
- OpenAI GPT-4 integration
- Anthropic Claude integration
- ChromaDB vector store for knowledge base
- AI-powered insights and automation

### 4. Type Safety
- TypeScript throughout frontend
- Pydantic validation in backend
- Shared type definitions
- API contract enforcement

### 5. Authentication & Security
- JWT-based authentication
- NextAuth.js integration
- Bcrypt password hashing
- Role-Based Access Control (RBAC)
- Permission system

### 6. Database Architecture
- **PostgreSQL 16** - Primary relational database for all application data
  - All modules use the same PostgreSQL instance
  - Schema-based organization (shared, dashboard, accounting, sales, hr, legal, rd)
  - Connection pooling and async operations
- **Redis 7** - In-memory cache and session store
  - Caching layer for frequently accessed data
  - Session management
  - Real-time event pub/sub
- **ChromaDB** - Vector database for AI/ML features
  - Stores embeddings for semantic search
  - Knowledge base for AI agents
  - Document similarity and retrieval

### 7. Developer Experience
- Hot reload in development
- Interactive API documentation (Swagger/ReDoc)
- Type hints and validation
- Docker for consistent environments
- Comprehensive logging

## Environment Variables

### Root `.env`

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/business_management
REDIS_URL=redis://localhost:6379
CHROMA_URL=http://localhost:8000

# Auth
NEXTAUTH_SECRET=your-secret-key-change-in-production
JWT_SECRET=your-jwt-secret-change-in-production

# AI Services
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# API Gateway
API_GATEWAY_URL=http://localhost:4000
```

### Module-specific

Each module has its own `.env` file. See `.env.example` in each module directory.

## Database Schema

The platform uses schema-based organization in PostgreSQL:

- `shared` - Users, permissions, audit logs
- `dashboard` - Widgets, notifications
- `accounting` - Accounts, transactions
- `sales` - Leads, customers, campaigns
- `hr` - Employees, payroll
- `legal` - Contracts, compliance
- `rd` - Projects, research

See `infrastructure/databases/init-scripts/01-init-database.sql` for details.

## API Gateway Routes

The API Gateway routes requests to appropriate microservices:

```
/api/dashboard/*       → dashboard-backend:8000
/api/accounting/*      → accounting-backend:8000
/api/administration/*  → administration-backend:8000
/api/sales/*          → sales-backend:8000
/api/hr/*             → hr-backend:8000
/api/legal/*          → legal-backend:8000
/api/rd/*             → rd-backend:8000
```

## Docker Commands Reference

### Starting Services

```bash
# Start all services
docker-compose up -d --build

# Start specific services only
docker-compose up -d postgres redis chromadb

# Start without building
docker-compose up -d

# Start and view logs
docker-compose up
```

### Managing Services

```bash
# List all containers
docker-compose ps

# View logs of all services
docker-compose logs -f

# View logs of specific service
docker-compose logs -f dashboard-frontend
docker-compose logs -f accounting-backend

# Restart a specific service
docker-compose restart dashboard-frontend

# Restart all services
docker-compose restart

# Stop all services
docker-compose stop

# Stop specific service
docker-compose stop dashboard-frontend
```

### Stopping and Cleaning

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean database)
docker-compose down -v

# Stop, remove volumes and images
docker-compose down -v --rmi all

# Remove unused Docker resources
docker system prune -a
```

### Rebuilding Services

```bash
# Rebuild specific service
docker-compose up -d --build dashboard-frontend

# Rebuild all services
docker-compose up -d --build

# Force rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Accessing Containers

```bash
# Execute command in running container
docker-compose exec dashboard-backend bash

# View container details
docker-compose exec postgres psql -U postgres -d business_management

# Access Redis CLI
docker-compose exec redis redis-cli
```

### Monitoring

```bash
# View resource usage
docker stats

# View specific container logs with timestamps
docker-compose logs -f --timestamps dashboard-backend

# View last 100 lines of logs
docker-compose logs --tail=100 accounting-backend
```

## Testing

```bash
# Backend tests (in each module)
cd modules/<module>/backend
pytest

# Frontend tests (in each module)
cd modules/<module>/frontend
npm test
```

## Deployment

### Production Build

```bash
# Build all frontend apps
for module in modules/*/frontend; do
  cd $module && npm run build && cd -
done

# Build API Gateway
cd infrastructure/api-gateway
npm run build
```

### Docker Production

```bash
# Create production docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## Adding a New Module

1. Create module structure:

```bash
./create-module.sh <module-name> <module-title> <port-frontend> <port-backend>
```

2. Add to `docker-compose.yml`

3. Add route to API Gateway

4. Update root `package.json` workspace

## Troubleshooting

### Port Conflicts

```bash
# Check if ports are in use
lsof -i :3000-3006,4000,8001-8007,5432,6379

# Kill process using port (macOS/Linux)
kill -9 $(lsof -ti:3000)

# Kill process using port (Windows PowerShell)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force

# Stop all containers and start fresh
docker-compose down
docker-compose up -d
```

### Database Connection Issues

```bash
# Reset database completely
docker-compose down -v
docker-compose up -d postgres redis chromadb

# Wait for databases to be ready
docker-compose logs -f postgres

# Restart all services after databases are up
docker-compose up -d
```

### Container Not Starting

```bash
# Check logs for errors
docker-compose logs <service-name>

# Example: Check dashboard backend logs
docker-compose logs dashboard-backend

# Rebuild specific service
docker-compose up -d --build <service-name>

# Force rebuild without cache
docker-compose build --no-cache <service-name>
docker-compose up -d <service-name>
```

### Volume Permission Issues

```bash
# Fix volume permissions (macOS/Linux)
docker-compose down
sudo chown -R $USER:$USER .

# Remove volumes and recreate
docker-compose down -v
docker-compose up -d
```

### Network Issues

```bash
# Remove and recreate network
docker-compose down
docker network prune
docker-compose up -d

# Check network connectivity
docker-compose exec dashboard-backend ping postgres
docker-compose exec dashboard-backend ping redis
```

### Container Out of Memory

```bash
# Check resource usage
docker stats

# Increase Docker Desktop memory limit
# Docker Desktop → Settings → Resources → Memory → Increase limit

# Restart Docker Desktop
```

### Build Failures

```bash
# Clear Docker build cache
docker builder prune -a

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Service Health Checks

```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Check Redis
docker-compose exec redis redis-cli ping

# Check ChromaDB
curl http://localhost:8000/api/v1/heartbeat

# Check all services
docker-compose ps
```

### Clean Start (Nuclear Option)

```bash
# This will remove everything and start fresh
docker-compose down -v --rmi all
docker system prune -a --volumes
docker-compose up -d --build

# WARNING: This will delete all data!
```

## Performance Optimization

### Frontend
- Next.js SSR/SSG for faster initial loads
- Image optimization
- Code splitting
- Lazy loading

### Backend
- Connection pooling
- Redis caching
- Async database operations
- Query optimization

### Infrastructure
- Nginx reverse proxy (production)
- Load balancing
- CDN for static assets
- Database indexing

## Security Best Practices

1. **Change default credentials**
2. **Use environment variables** for secrets
3. **Enable HTTPS** in production
4. **Implement rate limiting**
5. **Regular security audits**
6. **Keep dependencies updated**
7. **Use strong passwords**
8. **Enable CORS selectively**
9. **Validate all inputs**
10. **Implement audit logging**

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is proprietary. All rights reserved.

## Support

For issues and questions:
- Open an issue on GitHub
- Contact: support@example.com
- Documentation: [Link to docs]

## Roadmap

### Phase 1 (Current)
- ✅ Core infrastructure
- ✅ API Gateway
- ✅ Dashboard module
- ✅ All business modules structure

### Phase 2 (Next)
- 🔄 Complete CRUD operations for all modules
- 🔄 AI agent implementations
- 🔄 Advanced reporting
- 🔄 Mobile app foundation

### Phase 3 (Future)
- ⏳ Multi-tenancy
- ⏳ Advanced analytics
- ⏳ Mobile apps
- ⏳ Third-party integrations

## Acknowledgments

- Next.js team for the amazing framework
- FastAPI for the fast, modern Python framework
- shadcn/ui for beautiful components
- The open-source community

---

**Built with ❤️ for modern businesses**
