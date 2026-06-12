from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from app.core.config import settings
from app.core.database import init_db
from app.api.endpoints import api_router
# Import all models to ensure they are registered with Base
from app.models import ExecutiveBoard, LegalCase, CompliancePolicy, ComplianceAudit, StrategicInitiative


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown."""
    # Startup
    print("Starting up Administration API...")
    await init_db()
    print("Database tables created successfully!")
    yield
    # Shutdown
    print("Shutting down Administration API...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Mount static files for uploads
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Administration API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.VERSION
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
