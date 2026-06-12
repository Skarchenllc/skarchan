from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from typing import List, Optional
from datetime import datetime, date, timedelta
from uuid import UUID
import calendar

from app.core.database import get_db
from app.models.payroll import (
    Employee,
    SalaryStructure,
    TaxConfiguration,
    PayrollRun,
    Payslip,
    PayrollJournal,
    TimeEntry,
    PayrollStatus,
    EmploymentStatus,
    TaxType,
)
from app.models.account import Account
from app.schemas.payroll import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    SalaryStructureCreate,
    SalaryStructureUpdate,
    SalaryStructureResponse,
    TaxConfigurationCreate,
    TaxConfigurationUpdate,
    TaxConfigurationResponse,
    PayrollRunCreate,
    PayrollRunUpdate,
    PayrollRunResponse,
    PayslipCreate,
    PayslipResponse,
    TimeEntryCreate,
    TimeEntryUpdate,
    TimeEntryResponse,
    ProcessPayrollRequest,
    ProcessPayrollResponse,
    PayrollJournalCreate,
    PayrollJournalResponse,
    PayrollSummaryReport,
    EmployeePayrollSummary,
    TaxLiabilitySummary,
    EarningsDetail,
    TaxDetail,
    DeductionDetail,
    ContributionDetail,
)

router = APIRouter()


# ===== Employee Management =====

@router.post("/employees", response_model=EmployeeResponse)
async def create_employee(
    employee_data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new employee"""
    # Check if employee code already exists
    result = await db.execute(
        select(Employee).where(Employee.employee_code == employee_data.employee_code)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Employee code already exists")

    employee = Employee(**employee_data.model_dump(), created_by="system")
    db.add(employee)
    await db.flush()
    await db.refresh(employee)
    return employee


@router.get("/employees", response_model=List[EmployeeResponse])
async def get_employees(
    skip: int = 0,
    limit: int = 100,
    status: Optional[EmploymentStatus] = None,
    department: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get all employees with optional filters"""
    query = select(Employee)

    if status:
        query = query.where(Employee.employment_status == status)
    if department:
        query = query.where(Employee.department == department)
    if is_active is not None:
        query = query.where(Employee.is_active == is_active)

    query = query.offset(skip).limit(limit).order_by(Employee.employee_code)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get employee by ID"""
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: UUID,
    employee_data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update employee"""
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = employee_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)

    await db.flush()
    await db.refresh(employee)
    return employee


@router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: UUID, db: AsyncSession = Depends(get_db)):
    """Soft delete employee"""
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    employee.is_active = False
    employee.employment_status = EmploymentStatus.TERMINATED
    await db.flush()
    return {"message": "Employee deactivated successfully"}


# ===== Salary Structure Management =====

@router.post("/salary-structures", response_model=SalaryStructureResponse)
async def create_salary_structure(
    salary_data: SalaryStructureCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create salary structure for employee"""
    # Verify employee exists
    result = await db.execute(select(Employee).where(Employee.id == salary_data.employee_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Employee not found")

    # If this is marked as current, set all other structures for this employee to not current
    if salary_data.is_current:
        await db.execute(
            select(SalaryStructure).where(
                and_(
                    SalaryStructure.employee_id == salary_data.employee_id,
                    SalaryStructure.is_current == True
                )
            )
        )
        result = await db.execute(
            select(SalaryStructure).where(
                and_(
                    SalaryStructure.employee_id == salary_data.employee_id,
                    SalaryStructure.is_current == True
                )
            )
        )
        for existing in result.scalars().all():
            existing.is_current = False

    salary = SalaryStructure(**salary_data.model_dump(), created_by="system")
    db.add(salary)
    await db.flush()
    await db.refresh(salary)
    return salary


@router.get("/salary-structures", response_model=List[SalaryStructureResponse])
async def get_salary_structures(
    employee_id: Optional[UUID] = None,
    is_current: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get salary structures"""
    query = select(SalaryStructure)

    if employee_id:
        query = query.where(SalaryStructure.employee_id == employee_id)
    if is_current is not None:
        query = query.where(SalaryStructure.is_current == is_current)

    query = query.order_by(desc(SalaryStructure.effective_date))
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/salary-structures/{structure_id}", response_model=SalaryStructureResponse)
async def update_salary_structure(
    structure_id: UUID,
    salary_data: SalaryStructureUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update salary structure"""
    result = await db.execute(select(SalaryStructure).where(SalaryStructure.id == structure_id))
    salary = result.scalar_one_or_none()
    if not salary:
        raise HTTPException(status_code=404, detail="Salary structure not found")

    update_data = salary_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(salary, field, value)

    await db.flush()
    await db.refresh(salary)
    return salary


# ===== Tax Configuration =====

@router.post("/tax-configurations", response_model=TaxConfigurationResponse)
async def create_tax_configuration(
    tax_data: TaxConfigurationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create tax configuration"""
    # Check if tax code already exists
    result = await db.execute(
        select(TaxConfiguration).where(TaxConfiguration.tax_code == tax_data.tax_code)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Tax code already exists")

    tax_config = TaxConfiguration(**tax_data.model_dump())
    db.add(tax_config)
    await db.flush()
    await db.refresh(tax_config)
    return tax_config


@router.get("/tax-configurations", response_model=List[TaxConfigurationResponse])
async def get_tax_configurations(
    tax_type: Optional[TaxType] = None,
    is_active: Optional[bool] = None,
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get tax configurations"""
    query = select(TaxConfiguration)

    if tax_type:
        query = query.where(TaxConfiguration.tax_type == tax_type)
    if is_active is not None:
        query = query.where(TaxConfiguration.is_active == is_active)
    if state:
        query = query.where(TaxConfiguration.state == state)

    result = await db.execute(query)
    return result.scalars().all()


@router.put("/tax-configurations/{config_id}", response_model=TaxConfigurationResponse)
async def update_tax_configuration(
    config_id: UUID,
    tax_data: TaxConfigurationUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update tax configuration"""
    result = await db.execute(select(TaxConfiguration).where(TaxConfiguration.id == config_id))
    tax_config = result.scalar_one_or_none()
    if not tax_config:
        raise HTTPException(status_code=404, detail="Tax configuration not found")

    update_data = tax_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tax_config, field, value)

    await db.flush()
    await db.refresh(tax_config)
    return tax_config


# ===== Payroll Run Management =====

@router.post("/payroll-runs", response_model=PayrollRunResponse)
async def create_payroll_run(
    payroll_data: PayrollRunCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new payroll run"""
    # Check if payroll number already exists
    result = await db.execute(
        select(PayrollRun).where(PayrollRun.payroll_number == payroll_data.payroll_number)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Payroll number already exists")

    payroll_run = PayrollRun(**payroll_data.model_dump(), created_by="system")
    db.add(payroll_run)
    await db.flush()
    await db.refresh(payroll_run)
    return payroll_run


@router.get("/payroll-runs", response_model=List[PayrollRunResponse])
async def get_payroll_runs(
    skip: int = 0,
    limit: int = 100,
    status: Optional[PayrollStatus] = None,
    department: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get payroll runs with optional filters"""
    query = select(PayrollRun)

    if status:
        query = query.where(PayrollRun.status == status)
    if department:
        query = query.where(PayrollRun.department == department)
    if start_date:
        query = query.where(PayrollRun.pay_period_start >= start_date)
    if end_date:
        query = query.where(PayrollRun.pay_period_end <= end_date)

    query = query.offset(skip).limit(limit).order_by(desc(PayrollRun.pay_date))
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/payroll-runs/{run_id}", response_model=PayrollRunResponse)
async def get_payroll_run(run_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get payroll run by ID"""
    result = await db.execute(select(PayrollRun).where(PayrollRun.id == run_id))
    payroll_run = result.scalar_one_or_none()
    if not payroll_run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    return payroll_run


@router.post("/payroll-runs/{run_id}/process", response_model=ProcessPayrollResponse)
async def process_payroll(
    run_id: UUID,
    process_request: ProcessPayrollRequest,
    db: AsyncSession = Depends(get_db),
):
    """Process payroll for specified employees"""
    # Get payroll run
    result = await db.execute(select(PayrollRun).where(PayrollRun.id == run_id))
    payroll_run = result.scalar_one_or_none()
    if not payroll_run:
        raise HTTPException(status_code=404, detail="Payroll run not found")

    if payroll_run.status not in [PayrollStatus.DRAFT, PayrollStatus.APPROVED]:
        raise HTTPException(status_code=400, detail="Payroll run cannot be processed in current status")

    # Build employee query
    emp_query = select(Employee).where(Employee.employment_status == EmploymentStatus.ACTIVE)

    if process_request.employee_ids:
        emp_query = emp_query.where(Employee.id.in_(process_request.employee_ids))
    elif process_request.department:
        emp_query = emp_query.where(Employee.department == process_request.department)
    elif payroll_run.department:
        emp_query = emp_query.where(Employee.department == payroll_run.department)
    elif not process_request.include_all:
        raise HTTPException(status_code=400, detail="Must specify employees, department, or include_all")

    result = await db.execute(emp_query)
    employees = result.scalars().all()

    if not employees:
        raise HTTPException(status_code=400, detail="No eligible employees found")

    # Get active tax configurations
    tax_result = await db.execute(
        select(TaxConfiguration).where(
            and_(
                TaxConfiguration.is_active == True,
                TaxConfiguration.effective_date <= payroll_run.pay_date
            )
        )
    )
    tax_configs = tax_result.scalars().all()

    # Process each employee
    total_gross = 0.0
    total_net = 0.0
    total_employer_cost = 0.0
    payslips_created = 0
    errors = []

    for employee in employees:
        try:
            # Get current salary structure
            salary_result = await db.execute(
                select(SalaryStructure).where(
                    and_(
                        SalaryStructure.employee_id == employee.id,
                        SalaryStructure.is_current == True
                    )
                )
            )
            salary = salary_result.scalar_one_or_none()
            if not salary:
                errors.append(f"No active salary structure for employee {employee.employee_code}")
                continue

            # Calculate gross pay based on pay frequency
            gross_pay = _calculate_gross_pay(salary, payroll_run.pay_period_start, payroll_run.pay_period_end)

            # Build earnings details
            earnings = [
                EarningsDetail(
                    description="Base Salary",
                    rate=salary.hourly_rate if salary.hourly_rate > 0 else 0,
                    hours=0,
                    amount=gross_pay,
                    is_taxable=True
                )
            ]

            # Add additional earnings components
            if salary.earnings_components:
                for comp in salary.earnings_components:
                    amount = comp.get('amount', 0)
                    if comp.get('component_type') == 'percentage':
                        amount = gross_pay * (amount / 100)
                    earnings.append(EarningsDetail(
                        description=comp.get('component_name', ''),
                        rate=0,
                        hours=0,
                        amount=amount,
                        is_taxable=comp.get('is_taxable', True)
                    ))
                    gross_pay += amount

            # Calculate taxes
            taxable_gross = sum(e.amount for e in earnings if e.is_taxable)
            taxes, total_tax_amount = _calculate_taxes(employee, taxable_gross, tax_configs, payroll_run.pay_period_start)

            # Calculate deductions
            deductions = []
            total_deduction_amount = 0.0
            if salary.deductions_components:
                for comp in salary.deductions_components:
                    amount = comp.get('amount', 0)
                    if comp.get('component_type') == 'percentage':
                        base = taxable_gross if comp.get('is_pre_tax') else (taxable_gross - total_tax_amount)
                        amount = base * (amount / 100)
                    deductions.append(DeductionDetail(
                        description=comp.get('component_name', ''),
                        amount=amount,
                        is_pre_tax=comp.get('is_pre_tax', False)
                    ))
                    total_deduction_amount += amount

            # Calculate employer contributions
            contributions = []
            total_employer_contrib = 0.0
            if salary.employer_contributions:
                for comp in salary.employer_contributions:
                    amount = comp.get('amount', 0)
                    contributions.append(ContributionDetail(
                        description=comp.get('component_name', ''),
                        amount=amount
                    ))
                    total_employer_contrib += amount

            # Calculate net pay
            net_pay = gross_pay - total_tax_amount - total_deduction_amount

            # Get YTD totals (simplified - would need proper YTD calculation)
            ytd_gross = gross_pay
            ytd_taxes = total_tax_amount
            ytd_deductions = total_deduction_amount
            ytd_net = net_pay

            # Create payslip
            payslip = Payslip(
                payroll_run_id=run_id,
                employee_id=employee.id,
                pay_period_start=payroll_run.pay_period_start,
                pay_period_end=payroll_run.pay_period_end,
                pay_date=payroll_run.pay_date,
                earnings=[e.model_dump() for e in earnings],
                gross_pay=gross_pay,
                taxes=[t.model_dump() for t in taxes],
                total_taxes=total_tax_amount,
                deductions=[d.model_dump() for d in deductions],
                total_deductions=total_deduction_amount,
                employer_contributions=[c.model_dump() for c in contributions],
                total_employer_cost=total_employer_contrib,
                net_pay=net_pay,
                ytd_gross=ytd_gross,
                ytd_taxes=ytd_taxes,
                ytd_deductions=ytd_deductions,
                ytd_net=ytd_net,
                payment_method="direct_deposit",
                bank_account_last4=employee.bank_account[-4:] if employee.bank_account else None
            )
            db.add(payslip)

            total_gross += gross_pay
            total_net += net_pay
            total_employer_cost += total_employer_contrib
            payslips_created += 1

        except Exception as e:
            errors.append(f"Error processing employee {employee.employee_code}: {str(e)}")

    # Update payroll run totals
    payroll_run.total_gross_pay = total_gross
    payroll_run.total_net_pay = total_net
    payroll_run.total_employer_taxes = total_employer_cost
    payroll_run.employee_count = payslips_created
    payroll_run.status = PayrollStatus.PROCESSED
    payroll_run.processed_by = "system"
    payroll_run.processed_at = datetime.utcnow()

    await db.flush()

    return ProcessPayrollResponse(
        payroll_run_id=run_id,
        employee_count=payslips_created,
        total_gross_pay=total_gross,
        total_net_pay=total_net,
        total_employer_cost=total_employer_cost,
        payslips_created=payslips_created,
        errors=errors if errors else None
    )


def _calculate_gross_pay(salary: SalaryStructure, period_start: date, period_end: date) -> float:
    """Calculate gross pay based on salary structure and pay frequency"""
    if salary.annual_salary > 0:
        # Calculate based on pay frequency
        if salary.pay_frequency == "monthly":
            return salary.annual_salary / 12
        elif salary.pay_frequency == "semi_monthly":
            return salary.annual_salary / 24
        elif salary.pay_frequency == "bi_weekly":
            return salary.annual_salary / 26
        elif salary.pay_frequency == "weekly":
            return salary.annual_salary / 52
    elif salary.hourly_rate > 0:
        # Would need time entries for accurate calculation
        # Default to 80 hours for bi-weekly, 40 for weekly, etc.
        hours = 40 if salary.pay_frequency == "weekly" else 80
        return salary.hourly_rate * hours

    return 0.0


def _calculate_taxes(employee: Employee, gross_pay: float, tax_configs: List[TaxConfiguration], pay_date: date) -> tuple:
    """Calculate all applicable taxes"""
    taxes = []
    total_tax = 0.0

    for tax_config in tax_configs:
        # Check if tax applies
        if tax_config.wage_base_limit and gross_pay > tax_config.wage_base_limit:
            continue
        if tax_config.minimum_threshold and gross_pay < tax_config.minimum_threshold:
            continue

        # Calculate tax amount
        tax_amount = 0.0
        if tax_config.tax_brackets:
            # Progressive tax calculation
            for bracket in tax_config.tax_brackets:
                bracket_min = bracket.get('min_amount', 0)
                bracket_max = bracket.get('max_amount')
                bracket_rate = bracket.get('rate_percentage', 0)
                bracket_fixed = bracket.get('fixed_amount', 0)

                if gross_pay >= bracket_min:
                    taxable = gross_pay - bracket_min
                    if bracket_max:
                        taxable = min(taxable, bracket_max - bracket_min)
                    tax_amount = bracket_fixed + (taxable * bracket_rate / 100)
        else:
            # Simple percentage or fixed
            if tax_config.is_percentage:
                tax_amount = gross_pay * (tax_config.rate_percentage / 100)
            else:
                tax_amount = tax_config.fixed_amount

        # Apply employee portion
        employee_tax = tax_amount * (tax_config.employee_portion / 100)

        if employee_tax > 0:
            taxes.append(TaxDetail(
                tax_type=tax_config.tax_type.value,
                tax_code=tax_config.tax_code,
                description=tax_config.name,
                taxable_amount=gross_pay,
                rate=tax_config.rate_percentage,
                amount=employee_tax
            ))
            total_tax += employee_tax

    return taxes, total_tax


@router.post("/payroll-runs/{run_id}/approve", response_model=PayrollRunResponse)
async def approve_payroll_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Approve a payroll run"""
    result = await db.execute(select(PayrollRun).where(PayrollRun.id == run_id))
    payroll_run = result.scalar_one_or_none()
    if not payroll_run:
        raise HTTPException(status_code=404, detail="Payroll run not found")

    if payroll_run.status != PayrollStatus.PENDING_APPROVAL:
        raise HTTPException(status_code=400, detail="Payroll run is not pending approval")

    payroll_run.status = PayrollStatus.APPROVED
    payroll_run.approved_by = "system"
    payroll_run.approved_at = datetime.utcnow()

    await db.flush()
    await db.refresh(payroll_run)
    return payroll_run


@router.post("/payroll-runs/{run_id}/post-journal", response_model=PayrollJournalResponse)
async def post_payroll_journal(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Post payroll journal entries"""
    # Get payroll run
    result = await db.execute(select(PayrollRun).where(PayrollRun.id == run_id))
    payroll_run = result.scalar_one_or_none()
    if not payroll_run:
        raise HTTPException(status_code=404, detail="Payroll run not found")

    if payroll_run.status != PayrollStatus.PROCESSED:
        raise HTTPException(status_code=400, detail="Payroll run must be processed first")

    # Get all payslips for this run
    result = await db.execute(
        select(Payslip).where(Payslip.payroll_run_id == run_id)
    )
    payslips = result.scalars().all()

    if not payslips:
        raise HTTPException(status_code=400, detail="No payslips found for this payroll run")

    # Build journal lines
    journal_lines = []
    total_debits = 0.0
    total_credits = 0.0

    # Salary expense (debit)
    salary_expense_debit = sum(p.gross_pay for p in payslips)
    journal_lines.append({
        "account_id": None,  # Would need to get from config
        "account_code": "5100",
        "account_name": "Salary Expense",
        "debit": salary_expense_debit,
        "credit": 0.0,
        "description": f"Payroll for period {payroll_run.pay_period_start} to {payroll_run.pay_period_end}"
    })
    total_debits += salary_expense_debit

    # Tax liabilities (credit)
    total_taxes = sum(p.total_taxes for p in payslips)
    if total_taxes > 0:
        journal_lines.append({
            "account_id": None,
            "account_code": "2100",
            "account_name": "Payroll Tax Liability",
            "debit": 0.0,
            "credit": total_taxes,
            "description": "Tax withholdings"
        })
        total_credits += total_taxes

    # Other deductions (credit)
    total_deductions = sum(p.total_deductions for p in payslips)
    if total_deductions > 0:
        journal_lines.append({
            "account_id": None,
            "account_code": "2110",
            "account_name": "Other Payroll Deductions",
            "debit": 0.0,
            "credit": total_deductions,
            "description": "Payroll deductions"
        })
        total_credits += total_deductions

    # Salary payable (credit)
    net_pay = sum(p.net_pay for p in payslips)
    journal_lines.append({
        "account_id": None,
        "account_code": "2120",
        "account_name": "Salary Payable",
        "debit": 0.0,
        "credit": net_pay,
        "description": "Net pay payable to employees"
    })
    total_credits += net_pay

    # Create journal
    journal_number = f"PR-{payroll_run.payroll_number}"
    journal = PayrollJournal(
        payroll_run_id=run_id,
        journal_number=journal_number,
        journal_date=payroll_run.pay_date,
        journal_lines=journal_lines,
        total_debits=total_debits,
        total_credits=total_credits,
        description=f"Payroll journal for {payroll_run.payroll_number}",
        posted_by="system",
        posted_at=datetime.utcnow()
    )
    db.add(journal)

    # Update payroll run status
    payroll_run.status = PayrollStatus.POSTED
    payroll_run.posted_at = datetime.utcnow()

    await db.flush()
    await db.refresh(journal)
    return journal


# ===== Payslip Management =====

@router.get("/payslips", response_model=List[PayslipResponse])
async def get_payslips(
    payroll_run_id: Optional[UUID] = None,
    employee_id: Optional[UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get payslips with optional filters"""
    query = select(Payslip)

    if payroll_run_id:
        query = query.where(Payslip.payroll_run_id == payroll_run_id)
    if employee_id:
        query = query.where(Payslip.employee_id == employee_id)
    if start_date:
        query = query.where(Payslip.pay_date >= start_date)
    if end_date:
        query = query.where(Payslip.pay_date <= end_date)

    query = query.order_by(desc(Payslip.pay_date))
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/payslips/{payslip_id}", response_model=PayslipResponse)
async def get_payslip(payslip_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get payslip by ID"""
    result = await db.execute(select(Payslip).where(Payslip.id == payslip_id))
    payslip = result.scalar_one_or_none()
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    return payslip


# ===== Time Entry Management =====

@router.post("/time-entries", response_model=TimeEntryResponse)
async def create_time_entry(
    time_data: TimeEntryCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create time entry"""
    time_entry = TimeEntry(**time_data.model_dump(), created_by="system")
    db.add(time_entry)
    await db.flush()
    await db.refresh(time_entry)
    return time_entry


@router.get("/time-entries", response_model=List[TimeEntryResponse])
async def get_time_entries(
    employee_id: Optional[UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    is_approved: Optional[bool] = None,
    is_processed: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get time entries with filters"""
    query = select(TimeEntry)

    if employee_id:
        query = query.where(TimeEntry.employee_id == employee_id)
    if start_date:
        query = query.where(TimeEntry.entry_date >= start_date)
    if end_date:
        query = query.where(TimeEntry.entry_date <= end_date)
    if is_approved is not None:
        query = query.where(TimeEntry.is_approved == is_approved)
    if is_processed is not None:
        query = query.where(TimeEntry.is_processed == is_processed)

    query = query.order_by(desc(TimeEntry.entry_date))
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/time-entries/{entry_id}/approve", response_model=TimeEntryResponse)
async def approve_time_entry(
    entry_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Approve time entry"""
    result = await db.execute(select(TimeEntry).where(TimeEntry.id == entry_id))
    time_entry = result.scalar_one_or_none()
    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")

    time_entry.is_approved = True
    time_entry.approved_by = "system"
    time_entry.approved_at = datetime.utcnow()

    await db.flush()
    await db.refresh(time_entry)
    return time_entry


# ===== Reports =====

@router.get("/reports/summary", response_model=PayrollSummaryReport)
async def get_payroll_summary(
    start_date: date = Query(...),
    end_date: date = Query(...),
    department: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get payroll summary report for a period"""
    query = select(Payslip).where(
        and_(
            Payslip.pay_date >= start_date,
            Payslip.pay_date <= end_date
        )
    )

    result = await db.execute(query)
    payslips = result.scalars().all()

    # Get employee details
    employee_summaries = {}
    for payslip in payslips:
        emp_result = await db.execute(select(Employee).where(Employee.id == payslip.employee_id))
        employee = emp_result.scalar_one_or_none()

        if department and employee.department != department:
            continue

        if payslip.employee_id not in employee_summaries:
            employee_summaries[payslip.employee_id] = {
                "employee_id": employee.id,
                "employee_code": employee.employee_code,
                "employee_name": f"{employee.first_name} {employee.last_name}",
                "total_gross": 0.0,
                "total_taxes": 0.0,
                "total_deductions": 0.0,
                "total_net": 0.0,
                "payslip_count": 0
            }

        employee_summaries[payslip.employee_id]["total_gross"] += payslip.gross_pay
        employee_summaries[payslip.employee_id]["total_taxes"] += payslip.total_taxes
        employee_summaries[payslip.employee_id]["total_deductions"] += payslip.total_deductions
        employee_summaries[payslip.employee_id]["total_net"] += payslip.net_pay
        employee_summaries[payslip.employee_id]["payslip_count"] += 1

    employee_details = [EmployeePayrollSummary(**emp) for emp in employee_summaries.values()]

    return PayrollSummaryReport(
        period_start=start_date,
        period_end=end_date,
        total_employees=len(employee_summaries),
        total_gross_pay=sum(p.gross_pay for p in payslips),
        total_taxes=sum(p.total_taxes for p in payslips),
        total_deductions=sum(p.total_deductions for p in payslips),
        total_net_pay=sum(p.net_pay for p in payslips),
        total_employer_cost=sum(p.total_employer_cost for p in payslips),
        employee_details=employee_details
    )


@router.get("/reports/tax-liability", response_model=List[TaxLiabilitySummary])
async def get_tax_liability(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Get tax liability report"""
    result = await db.execute(
        select(Payslip).where(
            and_(
                Payslip.pay_date >= start_date,
                Payslip.pay_date <= end_date
            )
        )
    )
    payslips = result.scalars().all()

    # Aggregate by tax type
    tax_summary = {}
    for payslip in payslips:
        if payslip.taxes:
            for tax in payslip.taxes:
                tax_code = tax.get('tax_code')
                if tax_code not in tax_summary:
                    tax_summary[tax_code] = {
                        "tax_type": tax.get('tax_type', ''),
                        "tax_code": tax_code,
                        "tax_name": tax.get('description', ''),
                        "employee_withholding": 0.0,
                        "employer_contribution": 0.0,
                        "total_liability": 0.0
                    }
                amount = tax.get('amount', 0)
                tax_summary[tax_code]["employee_withholding"] += amount
                tax_summary[tax_code]["total_liability"] += amount

    return [TaxLiabilitySummary(**tax) for tax in tax_summary.values()]
