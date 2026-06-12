from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum, ForeignKey, Text, Date, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid
import enum

from app.core.database import Base


class EmploymentType(str, enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    TEMPORARY = "temporary"
    INTERN = "intern"


class EmploymentStatus(str, enum.Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    SUSPENDED = "suspended"
    TERMINATED = "terminated"


class PayFrequency(str, enum.Enum):
    WEEKLY = "weekly"
    BI_WEEKLY = "bi_weekly"
    SEMI_MONTHLY = "semi_monthly"
    MONTHLY = "monthly"


class PayrollStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    PROCESSING = "processing"
    PROCESSED = "processed"
    POSTED = "posted"
    CANCELLED = "cancelled"


class TaxType(str, enum.Enum):
    FEDERAL_INCOME = "federal_income"
    STATE_INCOME = "state_income"
    SOCIAL_SECURITY = "social_security"
    MEDICARE = "medicare"
    STATE_DISABILITY = "state_disability"
    UNEMPLOYMENT = "unemployment"
    LOCAL = "local"


class Employee(Base):
    """Employee master record for payroll"""
    __tablename__ = "employees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hr_employee_id = Column(String(100), index=True)  # Reference to HR system

    # Basic Information
    employee_code = Column(String(50), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100))
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(50))

    # Employment Details
    employment_type = Column(SQLEnum(EmploymentType), nullable=False)
    employment_status = Column(SQLEnum(EmploymentStatus), default=EmploymentStatus.ACTIVE, index=True)
    department = Column(String(100), index=True)
    job_title = Column(String(100))
    hire_date = Column(Date, nullable=False)
    termination_date = Column(Date)

    # Tax Information
    ssn = Column(String(20))  # Should be encrypted in production
    tax_id = Column(String(50))
    filing_status = Column(String(50))  # single, married, head_of_household
    allowances = Column(Integer, default=0)
    additional_withholding = Column(Float, default=0.0)

    # Bank Information
    bank_name = Column(String(255))
    bank_account = Column(String(100))
    routing_number = Column(String(50))

    # Address
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(50))
    zip_code = Column(String(20))
    country = Column(String(100), default="USA")

    # Metadata
    notes = Column(Text)
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Employee {self.employee_code} - {self.first_name} {self.last_name}>"


class SalaryStructure(Base):
    """Employee salary and compensation structure"""
    __tablename__ = "salary_structures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)

    # Pay Information
    pay_frequency = Column(SQLEnum(PayFrequency), nullable=False)
    effective_date = Column(Date, nullable=False)
    end_date = Column(Date)

    # Base Compensation
    annual_salary = Column(Float, default=0.0)
    hourly_rate = Column(Float, default=0.0)

    # Earnings Components (stored as JSON for flexibility)
    # [{component_name, component_type (fixed/percentage), amount, is_taxable, account_id}]
    earnings_components = Column(JSONB)
    # Examples: housing_allowance, transport_allowance, bonus, commission

    # Deduction Components (stored as JSON)
    # [{component_name, component_type (fixed/percentage), amount, is_pre_tax, account_id}]
    deductions_components = Column(JSONB)
    # Examples: health_insurance, 401k, loan_repayment, garnishment

    # Employer Contributions (stored as JSON)
    # [{component_name, amount/percentage, account_id}]
    employer_contributions = Column(JSONB)
    # Examples: employer_401k_match, health_insurance_contribution

    # Default Accounts for Posting
    salary_expense_account_id = Column(UUID(as_uuid=True))
    payable_account_id = Column(UUID(as_uuid=True))

    is_current = Column(Boolean, default=True)
    notes = Column(Text)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<SalaryStructure {self.employee_id} - {self.pay_frequency}>"


class TaxConfiguration(Base):
    """Tax rates and configuration"""
    __tablename__ = "tax_configurations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    tax_type = Column(SQLEnum(TaxType), nullable=False)
    tax_code = Column(String(50), nullable=False, index=True)
    name = Column(String(255), nullable=False)

    # Tax Calculation
    is_percentage = Column(Boolean, default=True)
    rate_percentage = Column(Float, default=0.0)  # e.g., 6.2 for Social Security
    fixed_amount = Column(Float, default=0.0)

    # Thresholds and Limits
    wage_base_limit = Column(Float)  # Maximum annual wages subject to this tax
    minimum_threshold = Column(Float)  # Minimum income before tax applies

    # Tax Brackets (for progressive taxes like federal income)
    # [{min_amount, max_amount, rate_percentage, fixed_amount}]
    tax_brackets = Column(JSONB)

    # Applicability
    state = Column(String(50))  # For state-specific taxes
    locality = Column(String(100))  # For local taxes

    # Employer/Employee Split
    employee_portion = Column(Float, default=100.0)  # Percentage paid by employee (0-100)
    employer_portion = Column(Float, default=0.0)  # Percentage paid by employer (0-100)

    # Accounting
    liability_account_id = Column(UUID(as_uuid=True))  # Where tax liability is recorded
    expense_account_id = Column(UUID(as_uuid=True))  # For employer portion

    effective_date = Column(Date, nullable=False)
    end_date = Column(Date)
    is_active = Column(Boolean, default=True, index=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<TaxConfiguration {self.tax_code} - {self.name}>"


class PayrollRun(Base):
    """Payroll processing run"""
    __tablename__ = "payroll_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Run Information
    payroll_number = Column(String(100), unique=True, nullable=False, index=True)
    pay_period_start = Column(Date, nullable=False)
    pay_period_end = Column(Date, nullable=False)
    pay_date = Column(Date, nullable=False)

    # Processing
    status = Column(SQLEnum(PayrollStatus), default=PayrollStatus.DRAFT, index=True)
    department = Column(String(100), index=True)  # If processing specific department

    # Totals
    total_gross_pay = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    total_employer_taxes = Column(Float, default=0.0)
    total_net_pay = Column(Float, default=0.0)
    employee_count = Column(Integer, default=0)

    # Journal Entry Reference
    journal_entry_id = Column(UUID(as_uuid=True))  # Link to posted journal entry
    posted_at = Column(DateTime)

    # Approval
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    # Processing
    processed_by = Column(String(100))
    processed_at = Column(DateTime)

    notes = Column(Text)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<PayrollRun {self.payroll_number} - {self.pay_date}>"


class Payslip(Base):
    """Individual employee payslip for a payroll run"""
    __tablename__ = "payslips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payroll_run_id = Column(UUID(as_uuid=True), ForeignKey("payroll_runs.id"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)

    # Pay Period
    pay_period_start = Column(Date, nullable=False)
    pay_period_end = Column(Date, nullable=False)
    pay_date = Column(Date, nullable=False)

    # Hours (for hourly employees)
    regular_hours = Column(Float, default=0.0)
    overtime_hours = Column(Float, default=0.0)
    total_hours = Column(Float, default=0.0)

    # Earnings Breakdown
    # [{description, rate, hours/quantity, amount, is_taxable}]
    earnings = Column(JSONB, nullable=False)
    gross_pay = Column(Float, nullable=False)

    # Tax Deductions
    # [{tax_type, tax_code, description, taxable_amount, rate, amount}]
    taxes = Column(JSONB)
    total_taxes = Column(Float, default=0.0)

    # Other Deductions
    # [{description, amount, is_pre_tax}]
    deductions = Column(JSONB)
    total_deductions = Column(Float, default=0.0)

    # Employer Contributions
    # [{description, amount}]
    employer_contributions = Column(JSONB)
    total_employer_cost = Column(Float, default=0.0)

    # Net Pay
    net_pay = Column(Float, nullable=False)

    # Year-to-Date Totals
    ytd_gross = Column(Float, default=0.0)
    ytd_taxes = Column(Float, default=0.0)
    ytd_deductions = Column(Float, default=0.0)
    ytd_net = Column(Float, default=0.0)

    # Payment Information
    payment_method = Column(String(50))  # direct_deposit, check, cash
    bank_account_last4 = Column(String(4))
    check_number = Column(String(50))

    # Status
    is_void = Column(Boolean, default=False)
    void_reason = Column(Text)
    voided_at = Column(DateTime)
    voided_by = Column(String(100))

    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Payslip {self.employee_id} - {self.pay_date}>"


class PayrollJournal(Base):
    """Journal entries for payroll posting"""
    __tablename__ = "payroll_journals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payroll_run_id = Column(UUID(as_uuid=True), ForeignKey("payroll_runs.id"), nullable=False)

    journal_number = Column(String(100), unique=True, nullable=False, index=True)
    journal_date = Column(Date, nullable=False)

    # Journal Entry Details
    # [{account_id, account_code, account_name, debit, credit, description, employee_id}]
    journal_lines = Column(JSONB, nullable=False)

    total_debits = Column(Float, nullable=False)
    total_credits = Column(Float, nullable=False)

    # Link to main accounting
    accounting_transaction_id = Column(UUID(as_uuid=True))  # Link to main Transaction table

    description = Column(Text)
    posted_by = Column(String(100))
    posted_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<PayrollJournal {self.journal_number} - {self.journal_date}>"


class TimeEntry(Base):
    """Time tracking for payroll (optional - for hourly employees)"""
    __tablename__ = "time_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)

    entry_date = Column(Date, nullable=False, index=True)
    clock_in = Column(DateTime)
    clock_out = Column(DateTime)

    # Hours
    regular_hours = Column(Float, default=0.0)
    overtime_hours = Column(Float, default=0.0)
    double_time_hours = Column(Float, default=0.0)
    sick_hours = Column(Float, default=0.0)
    vacation_hours = Column(Float, default=0.0)
    holiday_hours = Column(Float, default=0.0)

    # Project/Department allocation
    department = Column(String(100))
    project_code = Column(String(100))
    cost_center = Column(String(100))

    # Approval
    is_approved = Column(Boolean, default=False)
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    # Payroll processing
    payslip_id = Column(UUID(as_uuid=True), ForeignKey("payslips.id"))
    is_processed = Column(Boolean, default=False)

    notes = Column(Text)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<TimeEntry {self.employee_id} - {self.entry_date}>"
