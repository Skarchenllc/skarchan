from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Production Operations API"
    VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/production_db"

    # Redis (for caching, queues, etc.)
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    CORS_ORIGINS: list = ["*"]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: list = ["*"]
    CORS_HEADERS: list = ["*"]

    # API
    API_V1_PREFIX: str = "/api/v1"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
