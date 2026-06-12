# Production/Operations Module - Backend

A comprehensive FastAPI-based backend system for managing production operations, inventory, work orders, and manufacturing processes.

## Features

- **Product Management**: Manage raw materials, components, and finished goods
- **Bill of Materials (BOM)**: Define product compositions and cost structures
- **Work Orders**: Track production orders from draft to completion
- **Inventory Management**: Monitor stock levels across multiple locations
- **Production Lines**: Manage manufacturing lines and maintenance schedules
- **Statistics & Analytics**: Real-time dashboards for operational insights

## Technology Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM with async support
- **PostgreSQL**: Robust relational database
- **Redis**: In-memory data structure store for caching
- **Pydantic**: Data validation using Python type annotations
- **Uvicorn**: Lightning-fast ASGI server

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── endpoints/
│   │       ├── __init__.py
│   │       ├── products.py
│   │       ├── bom.py
│   │       ├── work_orders.py
│   │       ├── inventory.py
│   │       └── production_lines.py
│   ├── core/
│   │   ├── config.py
│   │   └── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── product.py
│   │   ├── bill_of_materials.py
│   │   ├── work_order.py
│   │   ├── inventory.py
│   │   └── production_line.py
│   └── main.py
├── seed_data.py
├── requirements.txt
├── Dockerfile.dev
├── docker-compose.yml
├── .env.example
└── README.md
```

## Database Models

### 1. Product
- Manages all product types (raw materials, components, finished goods)
- Tracks pricing, costs, and reorder points
- Stores custom specifications in JSONB format

### 2. Bill of Materials (BOM)
- Defines product composition and material requirements
- Calculates total costs (materials, labor, overhead)
- Supports versioning for BOM changes

### 3. Work Order
- Tracks production orders through their lifecycle
- Records planned vs actual quantities
- Manages priorities and assignments

### 4. Inventory
- Monitors stock levels by location
- Tracks reserved and available quantities
- Manages restock dates and stock counts

### 5. Production Line
- Manages manufacturing line status
- Tracks capacity and current work orders
- Schedules maintenance activities

## API Endpoints

### Products
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/{id}` - Get product details
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/{id}` - Update product
- `DELETE /api/v1/products/{id}` - Delete product
- `GET /api/v1/products/stats/overview` - Product statistics

### Bill of Materials
- `GET /api/v1/bom` - List all BOMs
- `GET /api/v1/bom/{id}` - Get BOM details
- `POST /api/v1/bom` - Create BOM
- `PUT /api/v1/bom/{id}` - Update BOM
- `DELETE /api/v1/bom/{id}` - Delete BOM
- `GET /api/v1/bom/stats/overview` - BOM statistics

### Work Orders
- `GET /api/v1/work-orders` - List all work orders
- `GET /api/v1/work-orders/{id}` - Get work order details
- `POST /api/v1/work-orders` - Create work order
- `PUT /api/v1/work-orders/{id}` - Update work order
- `DELETE /api/v1/work-orders/{id}` - Delete work order
- `GET /api/v1/work-orders/stats/overview` - Work order statistics

### Inventory
- `GET /api/v1/inventory` - List all inventory items
- `GET /api/v1/inventory/{id}` - Get inventory details
- `POST /api/v1/inventory` - Create inventory record
- `PUT /api/v1/inventory/{id}` - Update inventory
- `GET /api/v1/inventory/stats/overview` - Inventory statistics

### Production Lines
- `GET /api/v1/production-lines` - List all production lines
- `GET /api/v1/production-lines/{id}` - Get line details
- `POST /api/v1/production-lines` - Create production line
- `PUT /api/v1/production-lines/{id}` - Update production line
- `DELETE /api/v1/production-lines/{id}` - Delete production line
- `GET /api/v1/production-lines/stats/overview` - Production line statistics

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
   ```bash
   cd /Users/afzalhussain/Sites/company_projects/AI\ Projects/systems/modules/production/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

6. **Run database migrations**
   The application automatically creates tables on startup.

7. **Seed sample data**
   ```bash
   python seed_data.py
   ```

8. **Start the development server**
   ```bash
   uvicorn app.main:app --reload
   ```

### Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

## API Documentation

Once the application is running, access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Sample Data

The `seed_data.py` script populates the database with:

- **5 Products**: 2 raw materials, 1 component, 2 finished goods
- **3 Bill of Materials**: Complete cost structures
- **5 Work Orders**: Various statuses (draft, scheduled, in-progress, completed)
- **6 Inventory Records**: Multiple locations and stock levels
- **3 Production Lines**: Different statuses and capacities

## Configuration

Key configuration options in `app/core/config.py`:

```python
DATABASE_URL = "postgresql+asyncpg://user:pass@localhost:5432/production_db"
REDIS_URL = "redis://localhost:6379/0"
CORS_ORIGINS = ["*"]
API_V1_PREFIX = "/api/v1"
```

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black app/
isort app/
```

### Type Checking
```bash
mypy app/
```

## Deployment

### Environment Variables

Set these in your production environment:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `DEBUG`: Set to `False` in production
- `CORS_ORIGINS`: Limit to your frontend domain

### Production Server

```bash
# Using Gunicorn with Uvicorn workers
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## License

MIT License

## Support

For issues and questions, please open an issue in the repository.
