from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text, Date, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid
import enum

from app.core.database import Base


class PeriodType(str, enum.Enum):
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"
    CUSTOM = "custom"


class PeriodStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"
    LOCKED = "locked"  # Locked periods cannot be reopened


class AccountingPeriod(Base):
    """Accounting periods for financial reporting and control"""
    __tablename__ = "accounting_periods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Period Information
    period_name = Column(String(100), nullable=False)
    period_code = Column(String(50), unique=True, nullable=False, index=True)
    period_type = Column(SQLEnum(PeriodType), nullable=False)

    # Fiscal Year
    fiscal_year = Column(Integer, nullable=False, index=True)
    fiscal_year_name = Column(String(50))  # e.g., "FY 2026"

    # Date Range
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)

    # Status
    status = Column(SQLEnum(PeriodStatus), default=PeriodStatus.OPEN, index=True)

    # Period Hierarchy (for quarters/months within a year)
    parent_period_id = Column(UUID(as_uuid=True), ForeignKey("accounting_periods.id"))
    period_number = Column(Integer)  # 1-12 for months, 1-4 for quarters

    # Closing Information
    closed_by = Column(String(100))
    closed_at = Column(DateTime)
    closing_notes = Column(Text)

    # Locked Information
    locked_by = Column(String(100))
    locked_at = Column(DateTime)
    locked_notes = Column(Text)

    # Adjustments
    allow_adjustments = Column(Boolean, default=True)  # Allow period adjustments even when closed
    adjustment_count = Column(Integer, default=0)

    # Metadata
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Description
    description = Column(Text)

    def __repr__(self):
        return f"<AccountingPeriod {self.period_code} - {self.period_name}>"


class PeriodClosing(Base):
    """Period closing checklist and audit trail"""
    __tablename__ = "period_closings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Period Reference
    period_id = Column(UUID(as_uuid=True), ForeignKey("accounting_periods.id"), nullable=False)

    # Closing Steps
    checklist_item = Column(String(255), nullable=False)
    is_completed = Column(Boolean, default=False)
    completed_by = Column(String(100))
    completed_at = Column(DateTime)

    # Order and Category
    step_order = Column(Integer, default=0)
    category = Column(String(100))  # reconciliation, adjustments, reports, review

    # Notes
    notes = Column(Text)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<PeriodClosing {self.checklist_item} - Period:{self.period_id}>"


class YearEndClosing(Base):
    """Year-end closing process and retained earnings"""
    __tablename__ = "year_end_closings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Fiscal Year
    fiscal_year = Column(Integer, nullable=False, unique=True, index=True)
    fiscal_year_name = Column(String(50))

    # Year-End Process
    status = Column(String(50), default="in_progress")  # in_progress, completed, locked
    closing_date = Column(Date)

    # Financial Totals
    total_revenue = Column(Float, default=0.0)
    total_expenses = Column(Float, default=0.0)
    net_income = Column(Float, default=0.0)

    # Retained Earnings
    beginning_retained_earnings = Column(Float, default=0.0)
    ending_retained_earnings = Column(Float, default=0.0)
    dividends_paid = Column(Float, default=0.0)

    # Closing Entries
    revenue_closing_entry_id = Column(UUID(as_uuid=True))  # Journal entry ID
    expense_closing_entry_id = Column(UUID(as_uuid=True))  # Journal entry ID
    dividend_closing_entry_id = Column(UUID(as_uuid=True))  # Journal entry ID
    retained_earnings_entry_id = Column(UUID(as_uuid=True))  # Journal entry ID

    # Approval
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    # Metadata
    closed_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Notes
    notes = Column(Text)

    def __repr__(self):
        return f"<YearEndClosing FY{self.fiscal_year}>"


class PeriodAdjustment(Base):
    """Track adjustments made to closed periods"""
    __tablename__ = "period_adjustments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Period Reference
    period_id = Column(UUID(as_uuid=True), ForeignKey("accounting_periods.id"), nullable=False)

    # Adjustment Information
    adjustment_type = Column(String(50))  # accrual, correction, reclassification
    reason = Column(Text, nullable=False)

    # Transaction Reference
    transaction_id = Column(UUID(as_uuid=True))  # Reference to the adjustment transaction

    # Amounts
    debit_amount = Column(Float, default=0.0)
    credit_amount = Column(Float, default=0.0)

    # Approval
    requires_approval = Column(Boolean, default=True)
    approved_by = Column(String(100))
    approved_at = Column(DateTime)
    approval_notes = Column(Text)

    # Metadata
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<PeriodAdjustment {self.adjustment_type} - Period:{self.period_id}>"
