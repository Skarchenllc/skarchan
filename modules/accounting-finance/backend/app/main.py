from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base
from app.api.endpoints import router
from pathlib import Path

app = FastAPI(
    title="Accounting and Finance API",
    description="Financial management, accounting, and reporting",
    version="1.0.0"
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Mount static files for uploads
app.mount("/static/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router, prefix="/api/v1")

@app.on_event("startup")
async def startup():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✓ Database tables created successfully")
    except Exception as e:
        print(f"⚠ Warning: Could not connect to database: {e}")
        print("  Server will run but database operations will fail.")
        print("  Please configure PostgreSQL or use SQLite for testing.")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "module": "accounting-finance"}
