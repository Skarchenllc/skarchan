from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID

from app.models.bank_reconciliation import (
    ReconciliationStatus,
    StatementTransactionStatus
)


# Bank Account Schemas
class BankAccountBase(BaseModel):
    account_id: UUID
    bank_name: str = Field(..., max_length=255)
    account_number: str = Field(..., max_length=100)
    account_type: Optional[str] = Field(None, max_length=50)
    currency: str = Field(default="USD", max_length=3)
    is_active: bool = True


class BankAccountCreate(BankAccountBase):
    pass


class BankAccountUpdate(BaseModel):
    bank_name: Optional[str] = Field(None, max_length=255)
    account_number: Optional[str] = Field(None, max_length=100)
    account_type: Optional[str] = Field(None, max_length=50)
    currency: Optional[str] = Field(None, max_length=3)
    is_active: Optional[bool] = None


class BankAccountResponse(BankAccountBase):
    id: UUID
    last_reconciled_date: Optional[date] = None
    last_reconciled_balance: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Bank Reconciliation Schemas
class BankReconciliationBase(BaseModel):
    bank_account_id: UUID
    statement_date: date
    statement_balance: float
    book_balance: float
    notes: Optional[str] = None


class BankReconciliationCreate(BankReconciliationBase):
    pass


class BankReconciliationUpdate(BaseModel):
    statement_date: Optional[date] = None
    statement_balance: Optional[float] = None
    book_balance: Optional[float] = None
    status: Optional[ReconciliationStatus] = None
    notes: Optional[str] = None


class BankReconciliationResponse(BankReconciliationBase):
    id: UUID
    reconciled_balance: Optional[float] = None
    difference: Optional[float] = None
    status: ReconciliationStatus
    reconciled_by: Optional[str] = None
    reconciled_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Bank Statement Schemas
class BankStatementBase(BaseModel):
    bank_account_id: UUID
    statement_date: date
    opening_balance: float
    closing_balance: float


class BankStatementCreate(BankStatementBase):
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    uploaded_by: Optional[str] = None


class BankStatementResponse(BankStatementBase):
    id: UUID
    reconciliation_id: Optional[UUID] = None
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    uploaded_by: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


# Bank Statement Transaction Schemas
class BankStatementTransactionBase(BaseModel):
    transaction_date: date
    description: str
    reference: Optional[str] = Field(None, max_length=100)
    debit_amount: float = 0.0
    credit_amount: float = 0.0
    balance: Optional[float] = None
    value_date: Optional[date] = None


class BankStatementTransactionCreate(BankStatementTransactionBase):
    bank_statement_id: UUID


class BankStatementTransactionBulkCreate(BaseModel):
    bank_statement_id: UUID
    transactions: List[BankStatementTransactionBase]


class BankStatementTransactionUpdate(BaseModel):
    status: Optional[StatementTransactionStatus] = None
    matched_transaction_id: Optional[UUID] = None
    notes: Optional[str] = None


class BankStatementTransactionMatch(BaseModel):
    statement_transaction_id: UUID
    book_transaction_id: UUID
    is_manual: bool = True
    notes: Optional[str] = None


class BankStatementTransactionResponse(BankStatementTransactionBase):
    id: UUID
    bank_statement_id: UUID
    reconciliation_id: Optional[UUID] = None
    status: StatementTransactionStatus
    matched_transaction_id: Optional[UUID] = None
    match_confidence: Optional[float] = None
    match_reason: Optional[str] = None
    is_manual_match: bool
    matched_by: Optional[str] = None
    matched_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Reconciliation Item Schemas
class ReconciliationItemBase(BaseModel):
    item_type: str = Field(..., max_length=50)
    description: str
    amount: float
    transaction_date: Optional[date] = None
    notes: Optional[str] = None


class ReconciliationItemCreate(ReconciliationItemBase):
    reconciliation_id: UUID
    transaction_id: Optional[UUID] = None


class ReconciliationItemUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    is_cleared: Optional[bool] = None
    cleared_date: Optional[date] = None
    notes: Optional[str] = None


class ReconciliationItemResponse(ReconciliationItemBase):
    id: UUID
    reconciliation_id: UUID
    transaction_id: Optional[UUID] = None
    is_cleared: bool
    cleared_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# CSV Import Schema
class CSVImportRequest(BaseModel):
    bank_account_id: UUID
    statement_date: date
    opening_balance: float
    closing_balance: float
    csv_data: str  # Base64 encoded CSV content
    date_format: str = "%Y-%m-%d"
    column_mapping: dict = Field(
        default={
            "date": "Date",
            "description": "Description",
            "debit": "Debit",
            "credit": "Credit",
            "balance": "Balance",
            "reference": "Reference"
        }
    )


# Auto-matching Schema
class AutoMatchRequest(BaseModel):
    reconciliation_id: UUID
    bank_statement_id: UUID
    min_confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class AutoMatchResult(BaseModel):
    statement_transaction_id: UUID
    matched_transaction_id: UUID
    confidence: float
    reason: str


class AutoMatchResponse(BaseModel):
    total_statement_transactions: int
    auto_matched_count: int
    matches: List[AutoMatchResult]


# Reconciliation Summary Schema
class ReconciliationSummary(BaseModel):
    reconciliation_id: UUID
    bank_account_id: UUID
    statement_date: date
    statement_balance: float
    book_balance: float

    # Matching stats
    total_statement_transactions: int
    matched_transactions: int
    unmatched_transactions: int

    # Outstanding items
    deposits_in_transit: float
    outstanding_checks: float
    bank_charges: float
    other_adjustments: float

    # Final reconciliation
    adjusted_book_balance: float
    difference: float
    is_reconciled: bool

    status: ReconciliationStatus


# Statement Upload Response
class StatementUploadResponse(BaseModel):
    statement_id: UUID
    transactions_imported: int
    auto_matched: int
    unmatched: int
    message: str
