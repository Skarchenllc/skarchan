from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID


# Accounting Period Schemas
class AccountingPeriodBase(BaseModel):
    period_name: str = Field(..., min_length=1, max_length=100)
    period_code: str = Field(..., min_length=1, max_length=50)
    period_type: str  # month, quarter, year, custom
    fiscal_year: int
    fiscal_year_name: Optional[str] = Field(None, max_length=50)
    start_date: date
    end_date: date
    parent_period_id: Optional[UUID] = None
    period_number: Optional[int] = None
    description: Optional[str] = None

    @validator('end_date')
    def end_date_after_start_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class AccountingPeriodCreate(AccountingPeriodBase):
    pass


class AccountingPeriodUpdate(BaseModel):
    period_name: Optional[str] = Field(None, min_length=1, max_length=100)
    fiscal_year_name: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    allow_adjustments: Optional[bool] = None


class AccountingPeriodResponse(AccountingPeriodBase):
    id: UUID
    status: str
    allow_adjustments: bool
    adjustment_count: int
    closed_by: Optional[str]
    closed_at: Optional[datetime]
    locked_by: Optional[str]
    locked_at: Optional[datetime]
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Period Closing Schemas
class PeriodClosingBase(BaseModel):
    period_id: UUID
    checklist_item: str = Field(..., min_length=1, max_length=255)
    step_order: int = 0
    category: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class PeriodClosingCreate(PeriodClosingBase):
    pass


class PeriodClosingUpdate(BaseModel):
    is_completed: Optional[bool] = None
    notes: Optional[str] = None


class PeriodClosingResponse(PeriodClosingBase):
    id: UUID
    is_completed: bool
    completed_by: Optional[str]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Year End Closing Schemas
class YearEndClosingBase(BaseModel):
    fiscal_year: int
    fiscal_year_name: Optional[str] = Field(None, max_length=50)
    closing_date: Optional[date] = None
    beginning_retained_earnings: float = 0.0
    dividends_paid: float = 0.0
    notes: Optional[str] = None


class YearEndClosingCreate(YearEndClosingBase):
    pass


class YearEndClosingUpdate(BaseModel):
    status: Optional[str] = None
    closing_date: Optional[date] = None
    total_revenue: Optional[float] = None
    total_expenses: Optional[float] = None
    net_income: Optional[float] = None
    beginning_retained_earnings: Optional[float] = None
    ending_retained_earnings: Optional[float] = None
    dividends_paid: Optional[float] = None
    revenue_closing_entry_id: Optional[UUID] = None
    expense_closing_entry_id: Optional[UUID] = None
    dividend_closing_entry_id: Optional[UUID] = None
    retained_earnings_entry_id: Optional[UUID] = None
    notes: Optional[str] = None


class YearEndClosingResponse(YearEndClosingBase):
    id: UUID
    status: str
    total_revenue: float
    total_expenses: float
    net_income: float
    ending_retained_earnings: float
    revenue_closing_entry_id: Optional[UUID]
    expense_closing_entry_id: Optional[UUID]
    dividend_closing_entry_id: Optional[UUID]
    retained_earnings_entry_id: Optional[UUID]
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    closed_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Period Adjustment Schemas
class PeriodAdjustmentBase(BaseModel):
    period_id: UUID
    adjustment_type: str = Field(..., max_length=50)
    reason: str
    transaction_id: Optional[UUID] = None
    debit_amount: float = 0.0
    credit_amount: float = 0.0


class PeriodAdjustmentCreate(PeriodAdjustmentBase):
    pass


class PeriodAdjustmentUpdate(BaseModel):
    approved_by: Optional[str] = None
    approval_notes: Optional[str] = None


class PeriodAdjustmentResponse(PeriodAdjustmentBase):
    id: UUID
    requires_approval: bool
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    approval_notes: Optional[str]
    created_by: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Period Close Request
class PeriodCloseRequest(BaseModel):
    closed_by: str
    closing_notes: Optional[str] = None


# Period Reopen Request
class PeriodReopenRequest(BaseModel):
    reopened_by: str
    reason: str


# Period Lock Request
class PeriodLockRequest(BaseModel):
    locked_by: str
    locked_notes: Optional[str] = None


# Bulk Period Creation (for fiscal year setup)
class BulkPeriodCreate(BaseModel):
    fiscal_year: int
    fiscal_year_name: str
    start_date: date
    end_date: date
    period_type: str  # month or quarter
    create_year_period: bool = True  # Also create a year-level period


# Period Summary
class PeriodSummary(BaseModel):
    period_id: UUID
    period_code: str
    period_name: str
    status: str
    total_transactions: int
    total_debits: float
    total_credits: float
    is_balanced: bool
    pending_adjustments: int
