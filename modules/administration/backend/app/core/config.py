from pydantic_settings import BaseSettings
from typing import Optional, List, Union
from pydantic import field_validator


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Administration API"
    VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/business_management"

    # Redis (for caching, queues, etc.)
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS - Allow specific origins for security
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3108",  # Administration Frontend
        "http://localhost:3100",  # Dashboard Frontend
        "http://localhost:4200",  # API Gateway
        "http://localhost:3101",  # Accounting Frontend
    ]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    CORS_HEADERS: List[str] = ["*"]

    # API
    API_V1_PREFIX: str = "/api/v1"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[List[str], str]) -> List[str]:
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            return [origin.strip() for origin in v.split(",")]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env


settings = Settings()
