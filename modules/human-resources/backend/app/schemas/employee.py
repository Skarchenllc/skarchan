from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID

from app.models.employee import (
    EmploymentType,
    EmploymentStatus,
    MaritalStatus,
    Gender,
    LeaveType,
    LeaveStatus,
)


# ===== Employee Schemas =====

class EmployeeBase(BaseModel):
    employee_code: str = Field(..., max_length=50)
    first_name: str = Field(..., max_length=100)
    middle_name: Optional[str] = Field(None, max_length=100)
    last_name: str = Field(..., max_length=100)
    preferred_name: Optional[str] = Field(None, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    marital_status: Optional[MaritalStatus] = None
    nationality: Optional[str] = Field(None, max_length=100)
    personal_email: Optional[EmailStr] = None
    work_email: Optional[EmailStr] = None
    personal_phone: Optional[str] = Field(None, max_length=50)
    work_phone: Optional[str] = Field(None, max_length=50)
    emergency_contact_name: Optional[str] = Field(None, max_length=255)
    emergency_contact_phone: Optional[str] = Field(None, max_length=50)
    emergency_contact_relationship: Optional[str] = Field(None, max_length=100)
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=20)
    country: str = "USA"
    employment_type: EmploymentType
    employment_status: EmploymentStatus = EmploymentStatus.ACTIVE
    department_id: Optional[UUID] = None
    job_title: Optional[str] = Field(None, max_length=100)
    job_level: Optional[str] = Field(None, max_length=50)
    manager_id: Optional[UUID] = None
    hire_date: date
    probation_end_date: Optional[date] = None
    office_location: Optional[str] = Field(None, max_length=255)
    work_arrangement: Optional[str] = Field(None, max_length=50)
    benefits_eligible: bool = True
    benefits_start_date: Optional[date] = None
    # Financial/Compensation
    base_salary: Optional[float] = None
    hourly_rate: Optional[float] = None
    pay_frequency: Optional[str] = Field(None, max_length=50)
    currency: str = "USD"
    overtime_eligible: bool = False
    bonus_amount: Optional[float] = None
    commission_rate: Optional[float] = None
    # Banking Information
    bank_name: Optional[str] = Field(None, max_length=255)
    bank_account_number: Optional[str] = Field(None, max_length=100)
    bank_routing_number: Optional[str] = Field(None, max_length=50)
    bank_account_type: Optional[str] = Field(None, max_length=50)
    # Tax Information
    tax_id: Optional[str] = Field(None, max_length=50)
    tax_filing_status: Optional[str] = Field(None, max_length=50)
    tax_allowances: int = 0
    tax_additional_withholding: float = 0.0
    # Profile
    profile_photo_url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None
    is_active: bool = True


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    middle_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    preferred_name: Optional[str] = Field(None, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    marital_status: Optional[MaritalStatus] = None
    nationality: Optional[str] = Field(None, max_length=100)
    personal_email: Optional[EmailStr] = None
    work_email: Optional[EmailStr] = None
    personal_phone: Optional[str] = Field(None, max_length=50)
    work_phone: Optional[str] = Field(None, max_length=50)
    emergency_contact_name: Optional[str] = Field(None, max_length=255)
    emergency_contact_phone: Optional[str] = Field(None, max_length=50)
    emergency_contact_relationship: Optional[str] = Field(None, max_length=100)
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    employment_status: Optional[EmploymentStatus] = None
    department_id: Optional[UUID] = None
    job_title: Optional[str] = Field(None, max_length=100)
    job_level: Optional[str] = Field(None, max_length=50)
    manager_id: Optional[UUID] = None
    probation_end_date: Optional[date] = None
    termination_date: Optional[date] = None
    termination_reason: Optional[str] = None
    office_location: Optional[str] = Field(None, max_length=255)
    work_arrangement: Optional[str] = Field(None, max_length=50)
    benefits_eligible: Optional[bool] = None
    benefits_start_date: Optional[date] = None
    # Financial/Compensation
    base_salary: Optional[float] = None
    hourly_rate: Optional[float] = None
    pay_frequency: Optional[str] = Field(None, max_length=50)
    currency: Optional[str] = None
    overtime_eligible: Optional[bool] = None
    bonus_amount: Optional[float] = None
    commission_rate: Optional[float] = None
    # Banking Information
    bank_name: Optional[str] = Field(None, max_length=255)
    bank_account_number: Optional[str] = Field(None, max_length=100)
    bank_routing_number: Optional[str] = Field(None, max_length=50)
    bank_account_type: Optional[str] = Field(None, max_length=50)
    # Tax Information
    tax_id: Optional[str] = Field(None, max_length=50)
    tax_filing_status: Optional[str] = Field(None, max_length=50)
    tax_allowances: Optional[int] = None
    tax_additional_withholding: Optional[float] = None
    # Profile
    profile_photo_url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeResponse(EmployeeBase):
    id: UUID
    termination_date: Optional[date] = None
    termination_reason: Optional[str] = None
    performance_rating: Optional[float] = None
    last_review_date: Optional[date] = None
    next_review_date: Optional[date] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Department Schemas =====

class DepartmentBase(BaseModel):
    department_code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    parent_department_id: Optional[UUID] = None
    department_head_id: Optional[UUID] = None
    cost_center: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    parent_department_id: Optional[UUID] = None
    department_head_id: Optional[UUID] = None
    cost_center: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


class DepartmentResponse(DepartmentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Position Schemas =====

class PositionBase(BaseModel):
    position_code: str = Field(..., max_length=50)
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    department_id: Optional[UUID] = None
    job_level: Optional[str] = Field(None, max_length=50)
    required_education: Optional[str] = Field(None, max_length=255)
    required_experience_years: Optional[int] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    is_active: bool = True


class PositionCreate(PositionBase):
    pass


class PositionUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    department_id: Optional[UUID] = None
    job_level: Optional[str] = Field(None, max_length=50)
    required_education: Optional[str] = Field(None, max_length=255)
    required_experience_years: Optional[int] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    is_active: Optional[bool] = None


class PositionResponse(PositionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Leave Request Schemas =====

class LeaveRequestBase(BaseModel):
    employee_id: UUID
    leave_type: LeaveType
    start_date: date
    end_date: date
    total_days: float
    reason: Optional[str] = None


class LeaveRequestCreate(LeaveRequestBase):
    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, v, info):
        if v and info.data.get('start_date') and v < info.data['start_date']:
            raise ValueError('end_date must be after or equal to start_date')
        return v


class LeaveRequestUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_days: Optional[float] = None
    reason: Optional[str] = None
    status: Optional[LeaveStatus] = None


class LeaveRequestResponse(LeaveRequestBase):
    id: UUID
    status: LeaveStatus
    approved_by_id: Optional[UUID] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Leave Balance Schemas =====

class LeaveBalanceBase(BaseModel):
    employee_id: UUID
    leave_type: LeaveType
    year: int
    total_allocated: float = 0.0
    carried_forward: float = 0.0


class LeaveBalanceCreate(LeaveBalanceBase):
    pass


class LeaveBalanceUpdate(BaseModel):
    total_allocated: Optional[float] = None
    carried_forward: Optional[float] = None


class LeaveBalanceResponse(LeaveBalanceBase):
    id: UUID
    total_used: float
    total_pending: float
    total_available: float
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Performance Review Schemas =====

class PerformanceReviewBase(BaseModel):
    employee_id: UUID
    reviewer_id: Optional[UUID] = None
    review_period_start: date
    review_period_end: date
    review_date: Optional[date] = None
    overall_rating: Optional[float] = None
    technical_skills_rating: Optional[float] = None
    communication_rating: Optional[float] = None
    teamwork_rating: Optional[float] = None
    leadership_rating: Optional[float] = None
    strengths: Optional[str] = None
    areas_for_improvement: Optional[str] = None
    goals_achieved: Optional[str] = None
    goals_for_next_period: Optional[str] = None
    reviewer_comments: Optional[str] = None
    employee_comments: Optional[str] = None


class PerformanceReviewCreate(PerformanceReviewBase):
    pass


class PerformanceReviewUpdate(BaseModel):
    reviewer_id: Optional[UUID] = None
    review_date: Optional[date] = None
    overall_rating: Optional[float] = None
    technical_skills_rating: Optional[float] = None
    communication_rating: Optional[float] = None
    teamwork_rating: Optional[float] = None
    leadership_rating: Optional[float] = None
    strengths: Optional[str] = None
    areas_for_improvement: Optional[str] = None
    goals_achieved: Optional[str] = None
    goals_for_next_period: Optional[str] = None
    reviewer_comments: Optional[str] = None
    employee_comments: Optional[str] = None
    is_finalized: Optional[bool] = None


class PerformanceReviewResponse(PerformanceReviewBase):
    id: UUID
    is_finalized: bool
    finalized_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Attendance Record Schemas =====

class AttendanceRecordBase(BaseModel):
    employee_id: UUID
    attendance_date: date
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    regular_hours: float = 0.0
    overtime_hours: float = 0.0
    break_hours: float = 0.0
    status: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)


class AttendanceRecordCreate(AttendanceRecordBase):
    pass


class AttendanceRecordUpdate(BaseModel):
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    regular_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    break_hours: Optional[float] = None
    status: Optional[str] = Field(None, max_length=50)
    is_approved: Optional[bool] = None
    notes: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)


class AttendanceRecordResponse(AttendanceRecordBase):
    id: UUID
    is_approved: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Summary and Dashboard Schemas =====

class EmployeeSummary(BaseModel):
    total_employees: int
    active_employees: int
    on_leave: int
    terminated: int
    by_department: dict
    by_employment_type: dict


class LeaveSummary(BaseModel):
    pending_requests: int
    approved_this_month: int
    total_days_used: float
    employees_on_leave_today: int
