from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.transaction import TransactionStatus


class TransactionBase(BaseModel):
    date: datetime
    reference: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    debit_account_id: UUID
    credit_account_id: UUID
    status: TransactionStatus = Field(default=TransactionStatus.POSTED)
    notes: Optional[str] = None
    attachments: Optional[str] = None


class TransactionCreate(BaseModel):
    date: datetime
    reference: Optional[str] = Field(None, min_length=1, max_length=100)  # Optional for auto-generation
    description: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    debit_account_id: UUID
    credit_account_id: UUID
    status: TransactionStatus = Field(default=TransactionStatus.POSTED)
    notes: Optional[str] = None
    attachments: Optional[str] = None
    created_by: Optional[str] = None


class TransactionUpdate(BaseModel):
    date: Optional[datetime] = None
    reference: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1)
    amount: Optional[float] = Field(None, gt=0)
    debit_account_id: Optional[UUID] = None
    credit_account_id: Optional[UUID] = None
    status: Optional[TransactionStatus] = None
    notes: Optional[str] = None
    attachments: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: UUID
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionWithAccounts(TransactionResponse):
    debit_account: str
    credit_account: str

    class Config:
        from_attributes = True
