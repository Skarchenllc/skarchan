from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    POSTED = "posted"
    RECONCILED = "reconciled"
    VOID = "void"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date = Column(DateTime, nullable=False, default=datetime.utcnow)
    reference = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=False)
    amount = Column(Float, nullable=False)

    # Double-entry accounting
    debit_account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)
    credit_account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)

    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.PENDING)

    # Metadata
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Optional fields
    notes = Column(Text)
    attachments = Column(Text)  # JSON string of file URLs

    def __repr__(self):
        return f"<Transaction {self.reference} - {self.amount}>"
