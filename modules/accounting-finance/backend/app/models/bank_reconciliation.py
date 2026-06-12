from sqlalchemy import Column, String, Float, Boolean, DateTime, Enum as SQLEnum, ForeignKey, Text, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid
import enum

from app.core.database import Base


class ReconciliationStatus(str, enum.Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    APPROVED = "approved"


class StatementTransactionStatus(str, enum.Enum):
    UNMATCHED = "unmatched"
    MATCHED = "matched"
    IGNORED = "ignored"


class BankAccount(Base):
    """Bank account for reconciliation"""
    __tablename__ = "bank_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)
    bank_name = Column(String(255), nullable=False)
    account_number = Column(String(100), nullable=False)
    account_type = Column(String(50))  # Checking, Savings, etc.
    currency = Column(String(3), default="USD")
    is_active = Column(Boolean, default=True)

    # Last reconciliation info
    last_reconciled_date = Column(Date)
    last_reconciled_balance = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<BankAccount {self.bank_name} - {self.account_number}>"


class BankReconciliation(Base):
    """Bank reconciliation record"""
    __tablename__ = "bank_reconciliations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("bank_accounts.id"), nullable=False)

    # Reconciliation period
    statement_date = Column(Date, nullable=False)
    statement_balance = Column(Float, nullable=False)
    book_balance = Column(Float, nullable=False)

    # Calculated fields
    reconciled_balance = Column(Float)
    difference = Column(Float)  # Should be 0 when reconciled

    # Status and metadata
    status = Column(SQLEnum(ReconciliationStatus), default=ReconciliationStatus.DRAFT)
    reconciled_by = Column(String(100))
    reconciled_at = Column(DateTime)
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<BankReconciliation {self.statement_date} - {self.status}>"


class BankStatement(Base):
    """Bank statement upload"""
    __tablename__ = "bank_statements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("bank_accounts.id"), nullable=False)
    reconciliation_id = Column(UUID(as_uuid=True), ForeignKey("bank_reconciliations.id"))

    statement_date = Column(Date, nullable=False)
    opening_balance = Column(Float, nullable=False)
    closing_balance = Column(Float, nullable=False)

    file_name = Column(String(255))
    file_path = Column(String(500))

    uploaded_by = Column(String(100))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<BankStatement {self.statement_date} - {self.file_name}>"


class BankStatementTransaction(Base):
    """Individual transaction from bank statement"""
    __tablename__ = "bank_statement_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bank_statement_id = Column(UUID(as_uuid=True), ForeignKey("bank_statements.id"), nullable=False)
    reconciliation_id = Column(UUID(as_uuid=True), ForeignKey("bank_reconciliations.id"))

    # Transaction details from bank
    transaction_date = Column(Date, nullable=False)
    value_date = Column(Date)
    description = Column(Text, nullable=False)
    reference = Column(String(100))
    debit_amount = Column(Float, default=0.0)
    credit_amount = Column(Float, default=0.0)
    balance = Column(Float)

    # Matching information
    status = Column(SQLEnum(StatementTransactionStatus), default=StatementTransactionStatus.UNMATCHED)
    matched_transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"))
    match_confidence = Column(Float)  # 0.0 to 1.0
    match_reason = Column(Text)  # Why this match was suggested/made

    # Manual override
    is_manual_match = Column(Boolean, default=False)
    matched_by = Column(String(100))
    matched_at = Column(DateTime)

    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<BankStatementTransaction {self.transaction_date} - {self.description}>"


class ReconciliationItem(Base):
    """Outstanding items affecting reconciliation"""
    __tablename__ = "reconciliation_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reconciliation_id = Column(UUID(as_uuid=True), ForeignKey("bank_reconciliations.id"), nullable=False)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"))

    item_type = Column(String(50))  # deposit_in_transit, outstanding_check, bank_charge, etc.
    description = Column(Text, nullable=False)
    amount = Column(Float, nullable=False)
    transaction_date = Column(Date)

    is_cleared = Column(Boolean, default=False)
    cleared_date = Column(Date)

    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<ReconciliationItem {self.item_type} - {self.amount}>"
