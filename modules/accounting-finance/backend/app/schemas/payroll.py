from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID

from app.models.payroll import (
    EmploymentType,
    EmploymentStatus,
    PayFrequency,
    PayrollStatus,
    TaxType,
)


# ===== Employee Schemas =====

class EmployeeBase(BaseModel):
    hr_employee_id: Optional[str] = Field(None, max_length=100)
    employee_code: str = Field(..., max_length=50)
    first_name: str = Field(..., max_length=100)
    middle_name: Optional[str] = Field(None, max_length=100)
    last_name: str = Field(..., max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    employment_type: EmploymentType
    employment_status: EmploymentStatus = EmploymentStatus.ACTIVE
    department: Optional[str] = Field(None, max_length=100)
    job_title: Optional[str] = Field(None, max_length=100)
    hire_date: date
    termination_date: Optional[date] = None
    ssn: Optional[str] = Field(None, max_length=20)
    tax_id: Optional[str] = Field(None, max_length=50)
    filing_status: Optional[str] = Field(None, max_length=50)
    allowances: int = 0
    additional_withholding: float = 0.0
    bank_name: Optional[str] = Field(None, max_length=255)
    bank_account: Optional[str] = Field(None, max_length=100)
    routing_number: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=20)
    country: str = "USA"
    notes: Optional[str] = None
    is_active: bool = True


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    hr_employee_id: Optional[str] = Field(None, max_length=100)
    first_name: Optional[str] = Field(None, max_length=100)
    middle_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    employment_type: Optional[EmploymentType] = None
    employment_status: Optional[EmploymentStatus] = None
    department: Optional[str] = Field(None, max_length=100)
    job_title: Optional[str] = Field(None, max_length=100)
    termination_date: Optional[date] = None
    filing_status: Optional[str] = Field(None, max_length=50)
    allowances: Optional[int] = None
    additional_withholding: Optional[float] = None
    bank_name: Optional[str] = Field(None, max_length=255)
    bank_account: Optional[str] = Field(None, max_length=100)
    routing_number: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeResponse(EmployeeBase):
    id: UUID
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Salary Structure Schemas =====

class EarningsComponent(BaseModel):
    component_name: str
    component_type: str  # fixed, percentage
    amount: float
    is_taxable: bool = True
    account_id: Optional[UUID] = None


class DeductionComponent(BaseModel):
    component_name: str
    component_type: str  # fixed, percentage
    amount: float
    is_pre_tax: bool = False
    account_id: Optional[UUID] = None


class EmployerContribution(BaseModel):
    component_name: str
    amount: float
    account_id: Optional[UUID] = None


class SalaryStructureBase(BaseModel):
    employee_id: UUID
    pay_frequency: PayFrequency
    effective_date: date
    end_date: Optional[date] = None
    annual_salary: float = 0.0
    hourly_rate: float = 0.0
    earnings_components: Optional[List[EarningsComponent]] = None
    deductions_components: Optional[List[DeductionComponent]] = None
    employer_contributions: Optional[List[EmployerContribution]] = None
    salary_expense_account_id: Optional[UUID] = None
    payable_account_id: Optional[UUID] = None
    is_current: bool = True
    notes: Optional[str] = None


class SalaryStructureCreate(SalaryStructureBase):
    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, v, info):
        if v and info.data.get('effective_date') and v <= info.data['effective_date']:
            raise ValueError('end_date must be after effective_date')
        return v


class SalaryStructureUpdate(BaseModel):
    pay_frequency: Optional[PayFrequency] = None
    end_date: Optional[date] = None
    annual_salary: Optional[float] = None
    hourly_rate: Optional[float] = None
    earnings_components: Optional[List[EarningsComponent]] = None
    deductions_components: Optional[List[DeductionComponent]] = None
    employer_contributions: Optional[List[EmployerContribution]] = None
    salary_expense_account_id: Optional[UUID] = None
    payable_account_id: Optional[UUID] = None
    is_current: Optional[bool] = None
    notes: Optional[str] = None


class SalaryStructureResponse(SalaryStructureBase):
    id: UUID
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Tax Configuration Schemas =====

class TaxBracket(BaseModel):
    min_amount: float
    max_amount: Optional[float] = None
    rate_percentage: float
    fixed_amount: float = 0.0


class TaxConfigurationBase(BaseModel):
    tax_type: TaxType
    tax_code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=255)
    is_percentage: bool = True
    rate_percentage: float = 0.0
    fixed_amount: float = 0.0
    wage_base_limit: Optional[float] = None
    minimum_threshold: Optional[float] = None
    tax_brackets: Optional[List[TaxBracket]] = None
    state: Optional[str] = Field(None, max_length=50)
    locality: Optional[str] = Field(None, max_length=100)
    employee_portion: float = 100.0
    employer_portion: float = 0.0
    liability_account_id: Optional[UUID] = None
    expense_account_id: Optional[UUID] = None
    effective_date: date
    end_date: Optional[date] = None
    is_active: bool = True
    notes: Optional[str] = None


class TaxConfigurationCreate(TaxConfigurationBase):
    pass


class TaxConfigurationUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    is_percentage: Optional[bool] = None
    rate_percentage: Optional[float] = None
    fixed_amount: Optional[float] = None
    wage_base_limit: Optional[float] = None
    minimum_threshold: Optional[float] = None
    tax_brackets: Optional[List[TaxBracket]] = None
    employee_portion: Optional[float] = None
    employer_portion: Optional[float] = None
    liability_account_id: Optional[UUID] = None
    expense_account_id: Optional[UUID] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class TaxConfigurationResponse(TaxConfigurationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Payroll Run Schemas =====

class PayrollRunBase(BaseModel):
    payroll_number: str = Field(..., max_length=100)
    pay_period_start: date
    pay_period_end: date
    pay_date: date
    department: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class PayrollRunCreate(PayrollRunBase):
    @field_validator('pay_period_end')
    @classmethod
    def validate_period(cls, v, info):
        if v and info.data.get('pay_period_start') and v <= info.data['pay_period_start']:
            raise ValueError('pay_period_end must be after pay_period_start')
        return v


class PayrollRunUpdate(BaseModel):
    pay_date: Optional[date] = None
    status: Optional[PayrollStatus] = None
    notes: Optional[str] = None


class PayrollRunResponse(PayrollRunBase):
    id: UUID
    status: PayrollStatus
    total_gross_pay: float
    total_deductions: float
    total_employer_taxes: float
    total_net_pay: float
    employee_count: int
    journal_entry_id: Optional[UUID] = None
    posted_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    processed_by: Optional[str] = None
    processed_at: Optional[datetime] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Payslip Schemas =====

class EarningsDetail(BaseModel):
    description: str
    rate: float = 0.0
    hours: float = 0.0
    quantity: float = 1.0
    amount: float
    is_taxable: bool = True


class TaxDetail(BaseModel):
    tax_type: str
    tax_code: str
    description: str
    taxable_amount: float
    rate: float
    amount: float


class DeductionDetail(BaseModel):
    description: str
    amount: float
    is_pre_tax: bool = False


class ContributionDetail(BaseModel):
    description: str
    amount: float


class PayslipBase(BaseModel):
    payroll_run_id: UUID
    employee_id: UUID
    pay_period_start: date
    pay_period_end: date
    pay_date: date
    regular_hours: float = 0.0
    overtime_hours: float = 0.0
    total_hours: float = 0.0
    earnings: List[EarningsDetail]
    gross_pay: float
    taxes: Optional[List[TaxDetail]] = None
    total_taxes: float = 0.0
    deductions: Optional[List[DeductionDetail]] = None
    total_deductions: float = 0.0
    employer_contributions: Optional[List[ContributionDetail]] = None
    total_employer_cost: float = 0.0
    net_pay: float
    payment_method: Optional[str] = Field(None, max_length=50)
    bank_account_last4: Optional[str] = Field(None, max_length=4)
    check_number: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class PayslipCreate(PayslipBase):
    pass


class PayslipResponse(PayslipBase):
    id: UUID
    ytd_gross: float
    ytd_taxes: float
    ytd_deductions: float
    ytd_net: float
    is_void: bool
    void_reason: Optional[str] = None
    voided_at: Optional[datetime] = None
    voided_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Payroll Processing Schemas =====

class ProcessPayrollRequest(BaseModel):
    """Request to process payroll for specific employees or department"""
    employee_ids: Optional[List[UUID]] = None
    department: Optional[str] = None
    include_all: bool = False


class ProcessPayrollResponse(BaseModel):
    """Response after processing payroll"""
    payroll_run_id: UUID
    employee_count: int
    total_gross_pay: float
    total_net_pay: float
    total_employer_cost: float
    payslips_created: int
    errors: Optional[List[str]] = None


# ===== Journal Posting Schemas =====

class JournalLine(BaseModel):
    account_id: UUID
    account_code: str
    account_name: str
    debit: float = 0.0
    credit: float = 0.0
    description: Optional[str] = None
    employee_id: Optional[UUID] = None


class PayrollJournalBase(BaseModel):
    payroll_run_id: UUID
    journal_number: str = Field(..., max_length=100)
    journal_date: date
    journal_lines: List[JournalLine]
    total_debits: float
    total_credits: float
    description: Optional[str] = None


class PayrollJournalCreate(PayrollJournalBase):
    @field_validator('total_credits')
    @classmethod
    def validate_balance(cls, v, info):
        if 'total_debits' in info.data and abs(info.data['total_debits'] - v) > 0.01:
            raise ValueError('Total debits must equal total credits')
        return v


class PayrollJournalResponse(PayrollJournalBase):
    id: UUID
    accounting_transaction_id: Optional[UUID] = None
    posted_by: Optional[str] = None
    posted_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Time Entry Schemas =====

class TimeEntryBase(BaseModel):
    employee_id: UUID
    entry_date: date
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    regular_hours: float = 0.0
    overtime_hours: float = 0.0
    double_time_hours: float = 0.0
    sick_hours: float = 0.0
    vacation_hours: float = 0.0
    holiday_hours: float = 0.0
    department: Optional[str] = Field(None, max_length=100)
    project_code: Optional[str] = Field(None, max_length=100)
    cost_center: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class TimeEntryCreate(TimeEntryBase):
    pass


class TimeEntryUpdate(BaseModel):
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    regular_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    double_time_hours: Optional[float] = None
    sick_hours: Optional[float] = None
    vacation_hours: Optional[float] = None
    holiday_hours: Optional[float] = None
    department: Optional[str] = Field(None, max_length=100)
    project_code: Optional[str] = Field(None, max_length=100)
    cost_center: Optional[str] = Field(None, max_length=100)
    is_approved: Optional[bool] = None
    notes: Optional[str] = None


class TimeEntryResponse(TimeEntryBase):
    id: UUID
    is_approved: bool
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    payslip_id: Optional[UUID] = None
    is_processed: bool
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Payroll Summary and Reports =====

class EmployeePayrollSummary(BaseModel):
    employee_id: UUID
    employee_code: str
    employee_name: str
    total_gross: float
    total_taxes: float
    total_deductions: float
    total_net: float
    payslip_count: int


class PayrollSummaryReport(BaseModel):
    period_start: date
    period_end: date
    total_employees: int
    total_gross_pay: float
    total_taxes: float
    total_deductions: float
    total_net_pay: float
    total_employer_cost: float
    employee_details: List[EmployeePayrollSummary]


class TaxLiabilitySummary(BaseModel):
    tax_type: str
    tax_code: str
    tax_name: str
    employee_withholding: float
    employer_contribution: float
    total_liability: float
