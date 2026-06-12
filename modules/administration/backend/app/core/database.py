from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Create declarative base
Base = declarative_base()

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db():
    """Dependency for getting async database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables."""
    # Import all models to ensure they are registered with Base
    from app.models import ExecutiveBoard, LegalCase, CompliancePolicy, ComplianceAudit, StrategicInitiative

    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
