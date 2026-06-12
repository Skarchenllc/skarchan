from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os

# Database URL from environment variable
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/business_management"
)

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    future=True,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=40,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Create declarative base
Base = declarative_base()


# Dependency for FastAPI
async def get_db():
    """
    Dependency function to get database session.

    Usage in FastAPI:
        @app.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
