from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid
import enum

from app.core.database import Base


class BudgetPeriodType(str, enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"
    CUSTOM = "custom"


class BudgetStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"
    ARCHIVED = "archived"


class BudgetType(str, enum.Enum):
    OPERATIONAL = "operational"
    CAPITAL = "capital"
    PROJECT = "project"
    DEPARTMENTAL = "departmental"
    MASTER = "master"


class Budget(Base):
    """Budget master record"""
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Budget Information
    budget_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)

    # Budget Type and Period
    budget_type = Column(SQLEnum(BudgetType), nullable=False)
    period_type = Column(SQLEnum(BudgetPeriodType), nullable=False)

    # Date Range
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    # Status
    status = Column(SQLEnum(BudgetStatus), default=BudgetStatus.DRAFT)

    # Total Budget
    total_budget_amount = Column(Float, default=0.0)
    total_actual_amount = Column(Float, default=0.0)
    total_variance = Column(Float, default=0.0)
    variance_percentage = Column(Float, default=0.0)

    # Department/Project (optional)
    department = Column(String(100))
    project_id = Column(UUID(as_uuid=True))

    # Approval
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    # Metadata
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Notes
    notes = Column(Text)

    def __repr__(self):
        return f"<Budget {self.budget_code} - {self.name}>"


class BudgetLine(Base):
    """Budget line items by account"""
    __tablename__ = "budget_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Budget Reference
    budget_id = Column(UUID(as_uuid=True), ForeignKey("budgets.id"), nullable=False)

    # Account Reference
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)

    # Budget Amounts
    budgeted_amount = Column(Float, nullable=False)
    actual_amount = Column(Float, default=0.0)
    committed_amount = Column(Float, default=0.0)  # Encumbrances/commitments
    available_amount = Column(Float, default=0.0)  # Budget - Actual - Committed

    # Variance
    variance = Column(Float, default=0.0)
    variance_percentage = Column(Float, default=0.0)

    # Period Breakdown (optional - stores monthly/quarterly breakdown)
    period_breakdown = Column(JSONB)  # {period: amount}

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Notes
    notes = Column(Text)

    def __repr__(self):
        return f"<BudgetLine Budget:{self.budget_id} Account:{self.account_id}>"


class BudgetRevision(Base):
    """Budget revision/amendment history"""
    __tablename__ = "budget_revisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Budget Reference
    budget_id = Column(UUID(as_uuid=True), ForeignKey("budgets.id"), nullable=False)

    # Revision Information
    revision_number = Column(String(50), nullable=False)
    revision_date = Column(Date, nullable=False)
    reason = Column(Text)

    # Changes (stored as JSON for flexibility)
    changes = Column(JSONB)  # {field: {old_value, new_value}}

    # Previous and New Totals
    previous_total = Column(Float)
    new_total = Column(Float)
    adjustment_amount = Column(Float)

    # Approval
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    # Metadata
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<BudgetRevision {self.revision_number} for Budget:{self.budget_id}>"


class BudgetAlert(Base):
    """Budget alerts and threshold notifications"""
    __tablename__ = "budget_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Budget Reference
    budget_id = Column(UUID(as_uuid=True), ForeignKey("budgets.id"), nullable=False)
    budget_line_id = Column(UUID(as_uuid=True), ForeignKey("budget_lines.id"))

    # Alert Type
    alert_type = Column(String(50))  # threshold_exceeded, near_limit, overspent
    severity = Column(String(20))  # info, warning, critical

    # Threshold
    threshold_percentage = Column(Float)
    threshold_amount = Column(Float)

    # Current Status
    current_percentage = Column(Float)
    current_amount = Column(Float)

    # Alert Details
    message = Column(Text)
    triggered_at = Column(DateTime, default=datetime.utcnow)

    # Resolution
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(String(100))
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<BudgetAlert {self.alert_type} - Budget:{self.budget_id}>"


class BudgetScenario(Base):
    """Budget scenarios for what-if analysis"""
    __tablename__ = "budget_scenarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Scenario Information
    scenario_name = Column(String(255), nullable=False)
    description = Column(Text)

    # Base Budget
    base_budget_id = Column(UUID(as_uuid=True), ForeignKey("budgets.id"))

    # Scenario Type
    scenario_type = Column(String(50))  # best_case, worst_case, conservative, aggressive

    # Adjustment Method
    adjustment_method = Column(String(50))  # percentage, fixed_amount, custom

    # Global Adjustment
    global_adjustment_percentage = Column(Float)
    global_adjustment_amount = Column(Float)

    # Scenario Data (complete budget snapshot)
    scenario_data = Column(JSONB)  # Full budget line items with adjustments

    # Total Amounts
    total_scenario_amount = Column(Float, default=0.0)
    variance_from_base = Column(Float, default=0.0)
    variance_percentage = Column(Float, default=0.0)

    # Metadata
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<BudgetScenario {self.scenario_name}>"


class BudgetTemplate(Base):
    """Budget templates for reuse"""
    __tablename__ = "budget_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Template Information
    template_name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))  # departmental, project, operational, etc.

    # Template Data
    template_data = Column(JSONB)  # Account structure and default allocations

    # Usage
    is_active = Column(Boolean, default=True)
    times_used = Column(Float, default=0)

    # Metadata
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<BudgetTemplate {self.template_name}>"
