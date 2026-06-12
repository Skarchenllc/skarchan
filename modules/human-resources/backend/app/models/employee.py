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
    ON_PROBATION = "on_probation"
    SUSPENDED = "suspended"
    TERMINATED = "terminated"
    RESIGNED = "resigned"


class MaritalStatus(str, enum.Enum):
    SINGLE = "single"
    MARRIED = "married"
    DIVORCED = "divorced"
    WIDOWED = "widowed"


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class Employee(Base):
    """Employee master record"""
    __tablename__ = "employees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Information
    employee_code = Column(String(50), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100))
    last_name = Column(String(100), nullable=False)
    preferred_name = Column(String(100))

    # Personal Information
    date_of_birth = Column(Date)
    gender = Column(SQLEnum(Gender))
    marital_status = Column(SQLEnum(MaritalStatus))
    nationality = Column(String(100))

    # Contact Information
    personal_email = Column(String(255))
    work_email = Column(String(255), unique=True, index=True)
    personal_phone = Column(String(50))
    work_phone = Column(String(50))
    emergency_contact_name = Column(String(255))
    emergency_contact_phone = Column(String(50))
    emergency_contact_relationship = Column(String(100))

    # Address
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    state = Column(String(50))
    zip_code = Column(String(20))
    country = Column(String(100), default="USA")

    # Employment Details
    employment_type = Column(SQLEnum(EmploymentType), nullable=False)
    employment_status = Column(SQLEnum(EmploymentStatus), default=EmploymentStatus.ACTIVE, index=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    job_title = Column(String(100))
    job_level = Column(String(50))

    # Reporting Structure
    manager_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"))
    reports_to_name = Column(String(255))  # Denormalized for quick access

    # Dates
    hire_date = Column(Date, nullable=False)
    probation_end_date = Column(Date)
    termination_date = Column(Date)
    termination_reason = Column(Text)

    # Work Location
    office_location = Column(String(255))
    work_arrangement = Column(String(50))  # remote, hybrid, onsite

    # Identification
    ssn = Column(String(20))  # Should be encrypted in production
    passport_number = Column(String(50))
    drivers_license = Column(String(50))

    # Documents (stored as file paths/URLs)
    profile_photo_url = Column(String(500))
    documents = Column(JSONB)  # Array of {type, name, url, uploaded_at}

    # Skills and Certifications
    skills = Column(JSONB)  # Array of skill names
    certifications = Column(JSONB)  # Array of {name, issuer, date, expiry}

    # Education
    education = Column(JSONB)  # Array of {degree, institution, year, field}

    # Performance
    performance_rating = Column(Float)
    last_review_date = Column(Date)
    next_review_date = Column(Date)

    # Benefits Eligibility
    benefits_eligible = Column(Boolean, default=True)
    benefits_start_date = Column(Date)

    # Financial/Compensation
    base_salary = Column(Float)  # Annual base salary
    hourly_rate = Column(Float)  # For hourly employees
    pay_frequency = Column(String(50))  # weekly, bi_weekly, semi_monthly, monthly
    currency = Column(String(10), default="USD")
    overtime_eligible = Column(Boolean, default=False)

    # Additional Compensation
    bonus_amount = Column(Float)
    commission_rate = Column(Float)
    allowances = Column(JSONB)  # Array of {type, amount, frequency}

    # Banking Information
    bank_name = Column(String(255))
    bank_account_number = Column(String(100))  # Should be encrypted in production
    bank_routing_number = Column(String(50))
    bank_account_type = Column(String(50))  # checking, savings

    # Tax Information
    tax_id = Column(String(50))  # Tax identification number
    tax_filing_status = Column(String(50))  # single, married, head_of_household
    tax_allowances = Column(Integer, default=0)
    tax_additional_withholding = Column(Float, default=0.0)

    # Custom Fields
    custom_fields = Column(JSONB)

    # Metadata
    notes = Column(Text)
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Employee {self.employee_code} - {self.first_name} {self.last_name}>"


class Department(Base):
    """Department/Division"""
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    department_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)

    parent_department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    department_head_id = Column(UUID(as_uuid=True))

    cost_center = Column(String(100))
    location = Column(String(255))

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Department {self.department_code} - {self.name}>"


class Position(Base):
    """Job Positions/Roles"""
    __tablename__ = "positions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    position_code = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)

    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    job_level = Column(String(50))

    # Requirements
    required_skills = Column(JSONB)
    required_education = Column(String(255))
    required_experience_years = Column(Integer)

    # Compensation Range
    salary_min = Column(Float)
    salary_max = Column(Float)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Position {self.position_code} - {self.title}>"


class LeaveType(str, enum.Enum):
    VACATION = "vacation"
    SICK = "sick"
    PERSONAL = "personal"
    MATERNITY = "maternity"
    PATERNITY = "paternity"
    BEREAVEMENT = "bereavement"
    UNPAID = "unpaid"
    SABBATICAL = "sabbatical"


class LeaveStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class LeaveRequest(Base):
    """Employee leave/time off requests"""
    __tablename__ = "leave_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    leave_type = Column(SQLEnum(LeaveType), nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Float, nullable=False)

    reason = Column(Text)
    status = Column(SQLEnum(LeaveStatus), default=LeaveStatus.PENDING)

    # Approval
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"))
    approved_at = Column(DateTime)
    rejection_reason = Column(Text)

    # Documents
    supporting_documents = Column(JSONB)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<LeaveRequest {self.employee_id} - {self.leave_type}>"


class LeaveBalance(Base):
    """Employee leave balance tracking"""
    __tablename__ = "leave_balances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    leave_type = Column(SQLEnum(LeaveType), nullable=False)

    year = Column(Integer, nullable=False)

    total_allocated = Column(Float, default=0.0)
    total_used = Column(Float, default=0.0)
    total_pending = Column(Float, default=0.0)
    total_available = Column(Float, default=0.0)

    carried_forward = Column(Float, default=0.0)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<LeaveBalance {self.employee_id} - {self.leave_type} {self.year}>"


class PerformanceReview(Base):
    """Employee performance reviews"""
    __tablename__ = "performance_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"))

    review_period_start = Column(Date, nullable=False)
    review_period_end = Column(Date, nullable=False)
    review_date = Column(Date)

    # Ratings (1-5 scale typically)
    overall_rating = Column(Float)
    technical_skills_rating = Column(Float)
    communication_rating = Column(Float)
    teamwork_rating = Column(Float)
    leadership_rating = Column(Float)

    # Detailed feedback
    strengths = Column(Text)
    areas_for_improvement = Column(Text)
    goals_achieved = Column(Text)
    goals_for_next_period = Column(Text)

    # Custom ratings
    custom_ratings = Column(JSONB)  # {category: rating}

    reviewer_comments = Column(Text)
    employee_comments = Column(Text)

    # Status
    is_finalized = Column(Boolean, default=False)
    finalized_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<PerformanceReview {self.employee_id} - {self.review_date}>"


class AttendanceRecord(Base):
    """Daily attendance tracking"""
    __tablename__ = "attendance_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    attendance_date = Column(Date, nullable=False, index=True)

    clock_in = Column(DateTime)
    clock_out = Column(DateTime)

    # Work hours
    regular_hours = Column(Float, default=0.0)
    overtime_hours = Column(Float, default=0.0)
    break_hours = Column(Float, default=0.0)

    # Status
    status = Column(String(50))  # present, absent, late, half_day, work_from_home
    is_approved = Column(Boolean, default=False)

    notes = Column(Text)
    location = Column(String(255))  # For remote work tracking

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<AttendanceRecord {self.employee_id} - {self.attendance_date}>"


class EmployeeCredential(Base):
    """Employee dashboard login credentials"""
    __tablename__ = "employee_credentials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False, unique=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    # Status
    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, default=True)

    # Security
    last_login = Column(DateTime)
    password_changed_at = Column(DateTime)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<EmployeeCredential {self.username}>"
