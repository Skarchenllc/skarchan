from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.endpoints import router
from app.models import Customer, CustomerContact, Opportunity, OpportunityActivity, Quote, Order

app = FastAPI(
    title="Sales API",
    description="Sales customers, opportunities, quotes, and orders management",
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

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "module": "sales"}
