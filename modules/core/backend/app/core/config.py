from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "Business Management Platform - Core API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/business_management"
    )

    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production-min-32-chars")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))  # 1 hour
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))  # 30 days

    # Password
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_REQUIRE_UPPERCASE: bool = True
    PASSWORD_REQUIRE_LOWERCASE: bool = True
    PASSWORD_REQUIRE_DIGIT: bool = True
    PASSWORD_REQUIRE_SPECIAL: bool = False

    # Session
    SESSION_EXPIRE_HOURS: int = 24
    MAX_SESSIONS_PER_USER: int = 5
    SESSION_INACTIVITY_TIMEOUT_MINUTES: int = 30

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005",
        "http://localhost:3006",
        "http://localhost:3007",
        "http://localhost:3008",
        "http://localhost:3100",
        "http://localhost:3101",
        "http://localhost:3103",
        "http://localhost:3104",
        "http://localhost:3106",
        "http://localhost:3107",
        "http://localhost:3108",
        "http://localhost:3109",
    ]

    # Email (for notifications, password reset, etc.)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply@example.com")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Business Management Platform")

    # Two-Factor Authentication
    TWO_FACTOR_ENABLED: bool = os.getenv("TWO_FACTOR_ENABLED", "False").lower() == "true"
    TWO_FACTOR_ISSUER: str = "Business Management Platform"

    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_UPLOAD_EXTENSIONS: list = [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx", ".xls", ".xlsx"]
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/app/uploads")

    # Audit Logging
    AUDIT_LOG_RETENTION_DAYS: int = 365
    AUDIT_LOG_SECURITY_EVENTS: bool = True

    # Organization Defaults
    DEFAULT_SUBSCRIPTION_TIER: str = "trial"
    DEFAULT_MAX_USERS: int = 10
    DEFAULT_MAX_STORAGE_GB: int = 10
    DEFAULT_MAX_API_CALLS_PER_DAY: int = 10000
    TRIAL_PERIOD_DAYS: int = 14

    # Notification
    NOTIFICATION_RETENTION_DAYS: int = 90
    NOTIFICATION_BATCH_SIZE: int = 100

    # API
    API_V1_PREFIX: str = "/api/v1"

    class Config:
        case_sensitive = True
        env_file = ".env"


# Global settings instance
settings = Settings()
