from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/business_management"
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]

    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    CHROMA_URL: str = "http://localhost:8000"

    class Config:
        env_file = ".env"

settings = Settings()
