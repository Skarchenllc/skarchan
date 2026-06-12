from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Boolean, Text, ForeignKey, Numeric, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.core.database import Base


class PayGrade(Base):
    __tablename__ = "pay_grades"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    grade_code = Column(String(50), unique=True, nullable=False)
    grade_name = Column(String(100), nullable=False)
    grade_level = Column(Integer, nullable=False)
    min_salary = Column(Numeric(12, 2), nullable=False)
    mid_salary = Column(Numeric(12, 2), nullable=False)
    max_salary = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default='USD')
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SalaryBand(Base):
    __tablename__ = "salary_bands"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_title = Column(String(200), nullable=False)
    department = Column(String(100))
    pay_grade_id = Column(UUID(as_uuid=True), ForeignKey('pay_grades.id'))
    min_salary = Column(Numeric(12, 2), nullable=False)
    mid_salary = Column(Numeric(12, 2), nullable=False)
    max_salary = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default='USD')
    market_data_source = Column(String(200))
    last_reviewed_date = Column(Date)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BenefitsPlan(Base):
    __tablename__ = "benefits_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_code = Column(String(50), unique=True, nullable=False)
    plan_name = Column(String(200), nullable=False)
    plan_type = Column(String(50), nullable=False)  # health, dental, vision, life, 401k
    provider_name = Column(String(200))
    coverage_level = Column(String(50))
    employee_cost_monthly = Column(Numeric(10, 2))
    employer_cost_monthly = Column(Numeric(10, 2))
    total_cost_monthly = Column(Numeric(10, 2))
    deductible = Column(Numeric(10, 2))
    out_of_pocket_max = Column(Numeric(10, 2))
    coverage_details = Column(JSONB)
    eligibility_criteria = Column(Text)
    is_active = Column(Boolean, default=True)
    effective_date = Column(Date)
    termination_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmployeeBenefit(Base):
    __tablename__ = "employee_benefits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    benefits_plan_id = Column(UUID(as_uuid=True), ForeignKey('benefits_plans.id'), nullable=False)
    enrollment_date = Column(Date, nullable=False)
    effective_date = Column(Date, nullable=False)
    termination_date = Column(Date)
    coverage_level = Column(String(50))
    dependents = Column(JSONB)
    employee_contribution = Column(Numeric(10, 2))
    employer_contribution = Column(Numeric(10, 2))
    status = Column(String(50), default='active')
    waiver_reason = Column(Text)
    beneficiaries = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Bonus(Base):
    __tablename__ = "bonuses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    bonus_type = Column(String(50), nullable=False)  # performance, sign_on, retention, spot, annual, quarterly
    bonus_name = Column(String(200))
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default='USD')
    performance_period_start = Column(Date)
    performance_period_end = Column(Date)
    payout_date = Column(Date)
    status = Column(String(50), default='pending')  # pending, approved, paid, cancelled
    approved_by = Column(String(100))
    approved_at = Column(DateTime)
    paid_date = Column(Date)
    payroll_run_id = Column(UUID(as_uuid=True))  # Removed FK - payroll_runs table not defined yet
    notes = Column(Text)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Commission(Base):
    __tablename__ = "commissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    commission_period_start = Column(Date, nullable=False)
    commission_period_end = Column(Date, nullable=False)
    sales_amount = Column(Numeric(12, 2))
    commission_rate = Column(Numeric(5, 2))
    commission_amount = Column(Numeric(12, 2), nullable=False)
    quota_amount = Column(Numeric(12, 2))
    quota_achievement_pct = Column(Numeric(5, 2))
    accelerator_applied = Column(Boolean, default=False)
    payout_date = Column(Date)
    status = Column(String(50), default='pending')  # pending, approved, paid, disputed
    approved_by = Column(String(100))
    approved_at = Column(DateTime)
    paid_date = Column(Date)
    payroll_run_id = Column(UUID(as_uuid=True))  # Removed FK - payroll_runs table not defined yet
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SalaryAdjustment(Base):
    __tablename__ = "salary_adjustments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    adjustment_type = Column(String(50), nullable=False)  # annual_increase, promotion, market_adjustment, merit_increase
    previous_salary = Column(Numeric(12, 2), nullable=False)
    new_salary = Column(Numeric(12, 2), nullable=False)
    adjustment_amount = Column(Numeric(12, 2))
    adjustment_percentage = Column(Numeric(5, 2))
    effective_date = Column(Date, nullable=False)
    reason = Column(Text)
    approved_by = Column(String(100))
    approved_at = Column(DateTime)
    notes = Column(Text)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
