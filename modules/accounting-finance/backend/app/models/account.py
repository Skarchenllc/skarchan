from sqlalchemy import Column, String, Float, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class AccountType(str, enum.Enum):
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"


class Account(Base):
    __tablename__ = "accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(SQLEnum(AccountType), nullable=False)
    category = Column(String(100))
    balance = Column(Float, default=0.0)
    currency = Column(String(3), default="USD")
    is_active = Column(Boolean, default=True)
    description = Column(String(500))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Account {self.code} - {self.name}>"
