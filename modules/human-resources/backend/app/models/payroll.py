from sqlalchemy import Column, String, Float, DateTime, Boolean, Text, ForeignKey, Date, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.database import Base


class PayrollRun(Base):
    """Payroll Run/Cycle"""
    __tablename__ = "payroll_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    payroll_number = Column(String(100), unique=True, nullable=False, index=True)
    pay_period_start = Column(Date, nullable=False)
    pay_period_end = Column(Date, nullable=False)
    pay_date = Column(Date, nullable=False)

    # Status
    status = Column(String(50), default="draft")  # draft, processing, completed, cancelled

    # Totals
    total_gross_pay = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    total_net_pay = Column(Float, default=0.0)
    employee_count = Column(Integer, default=0)

    # Processing details
    processed_by = Column(String(100))
    processed_at = Column(DateTime)
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    # Metadata
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<PayrollRun {self.payroll_number} - {self.status}>"


class Payslip(Base):
    """Employee Payslip/Paycheck"""
    __tablename__ = "payslips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # References
    payroll_run_id = Column(UUID(as_uuid=True), ForeignKey("payroll_runs.id"), nullable=False, index=True)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False, index=True)

    # Pay Period
    pay_period_start = Column(Date, nullable=False)
    pay_period_end = Column(Date, nullable=False)
    pay_date = Column(Date, nullable=False)

    # Hours
    regular_hours = Column(Float, default=0.0)
    overtime_hours = Column(Float, default=0.0)
    total_hours = Column(Float, default=0.0)

    # Earnings (JSONB - flexible structure for different earning types)
    earnings = Column(JSONB)  # {base_salary: X, overtime: Y, bonus: Z, commission: W, etc.}
    gross_pay = Column(Float, nullable=False)

    # Taxes (JSONB - flexible structure for different tax types)
    taxes = Column(JSONB)  # {federal: X, state: Y, local: Z, fica: W, medicare: V, etc.}
    total_taxes = Column(Float, default=0.0)

    # Deductions (JSONB - flexible structure for different deduction types)
    deductions = Column(JSONB)  # {401k: X, health_insurance: Y, dental: Z, etc.}
    total_deductions = Column(Float, default=0.0)

    # Employer Contributions (JSONB)
    employer_contributions = Column(JSONB)  # {401k_match: X, health_insurance: Y, etc.}
    total_employer_cost = Column(Float, default=0.0)

    # Net Pay
    net_pay = Column(Float, nullable=False)

    # Year-to-Date totals
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

    # Metadata
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Payslip {self.employee_id} - {self.pay_period_end}>"
