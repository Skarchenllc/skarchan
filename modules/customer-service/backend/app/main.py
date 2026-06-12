from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.endpoints import router
from app.api.endpoints import entity_records
from app.models import EntityRecord

app = FastAPI(
    title="Customer Service API",
    description="Customer support, ticketing, and service management",
    version="1.0.0"
)

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
app.include_router(entity_records.router, prefix="/api/v1", tags=["Entity Records"])

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "module": "customer-service"}
