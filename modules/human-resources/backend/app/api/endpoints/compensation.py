from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime

from app.core.database import get_db
from app.models.compensation import (
    PayGrade, SalaryBand, BenefitsPlan, EmployeeBenefit,
    Bonus, Commission, SalaryAdjustment
)

router = APIRouter()

# ============================================================================
# PAY GRADES & SALARY BANDS
# ============================================================================

@router.get("/pay-grades")
async def get_pay_grades(
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all pay grades"""
    query = select(PayGrade)
    if is_active is not None:
        query = query.where(PayGrade.is_active == is_active)
    query = query.order_by(PayGrade.grade_level)

    result = await db.execute(query)
    pay_grades = result.scalars().all()

    return [{
        "id": str(pg.id),
        "grade_code": pg.grade_code,
        "grade_name": pg.grade_name,
        "grade_level": pg.grade_level,
        "min_salary": float(pg.min_salary) if pg.min_salary else None,
        "mid_salary": float(pg.mid_salary) if pg.mid_salary else None,
        "max_salary": float(pg.max_salary) if pg.max_salary else None,
        "currency": pg.currency,
        "description": pg.description,
        "is_active": pg.is_active
    } for pg in pay_grades]


@router.get("/salary-bands")
async def get_salary_bands(
    job_title: Optional[str] = None,
    department: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get salary bands"""
    query = select(SalaryBand)

    if job_title:
        query = query.where(SalaryBand.job_title.ilike(f"%{job_title}%"))
    if department:
        query = query.where(SalaryBand.department == department)
    if is_active is not None:
        query = query.where(SalaryBand.is_active == is_active)

    query = query.order_by(SalaryBand.job_title)

    result = await db.execute(query)
    bands = result.scalars().all()

    return [{
        "id": str(b.id),
        "job_title": b.job_title,
        "department": b.department,
        "min_salary": float(b.min_salary) if b.min_salary else None,
        "mid_salary": float(b.mid_salary) if b.mid_salary else None,
        "max_salary": float(b.max_salary) if b.max_salary else None,
        "currency": b.currency,
        "market_data_source": b.market_data_source,
        "last_reviewed_date": b.last_reviewed_date.isoformat() if b.last_reviewed_date else None,
        "is_active": b.is_active
    } for b in bands]


# ============================================================================
# BENEFITS
# ============================================================================

@router.get("/benefits-plans")
async def get_benefits_plans(
    plan_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all benefits plans"""
    query = select(BenefitsPlan)

    if plan_type:
        query = query.where(BenefitsPlan.plan_type == plan_type)
    if is_active is not None:
        query = query.where(BenefitsPlan.is_active == is_active)

    query = query.order_by(BenefitsPlan.plan_type, BenefitsPlan.plan_name)

    result = await db.execute(query)
    plans = result.scalars().all()

    return [{
        "id": str(p.id),
        "plan_code": p.plan_code,
        "plan_name": p.plan_name,
        "plan_type": p.plan_type,
        "provider_name": p.provider_name,
        "coverage_level": p.coverage_level,
        "employee_cost_monthly": float(p.employee_cost_monthly) if p.employee_cost_monthly else None,
        "employer_cost_monthly": float(p.employer_cost_monthly) if p.employer_cost_monthly else None,
        "total_cost_monthly": float(p.total_cost_monthly) if p.total_cost_monthly else None,
        "deductible": float(p.deductible) if p.deductible else None,
        "out_of_pocket_max": float(p.out_of_pocket_max) if p.out_of_pocket_max else None,
        "is_active": p.is_active,
        "effective_date": p.effective_date.isoformat() if p.effective_date else None
    } for p in plans]


@router.get("/employee-benefits")
async def get_employee_benefits(
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get employee benefits enrollments"""
    query = select(EmployeeBenefit)

    if employee_id:
        query = query.where(EmployeeBenefit.employee_id == UUID(employee_id))
    if status:
        query = query.where(EmployeeBenefit.status == status)

    result = await db.execute(query)
    enrollments = result.scalars().all()

    return [{
        "id": str(e.id),
        "employee_id": str(e.employee_id),
        "benefits_plan_id": str(e.benefits_plan_id),
        "enrollment_date": e.enrollment_date.isoformat() if e.enrollment_date else None,
        "effective_date": e.effective_date.isoformat() if e.effective_date else None,
        "termination_date": e.termination_date.isoformat() if e.termination_date else None,
        "coverage_level": e.coverage_level,
        "employee_contribution": float(e.employee_contribution) if e.employee_contribution else None,
        "employer_contribution": float(e.employer_contribution) if e.employer_contribution else None,
        "status": e.status
    } for e in enrollments]


@router.get("/employee-benefits/summary")
async def get_employee_benefits_summary(db: AsyncSession = Depends(get_db)):
    """Get benefits enrollment summary"""
    # Total enrollments
    total_query = select(func.count(EmployeeBenefit.id))
    total_result = await db.execute(total_query)
    total_enrollments = total_result.scalar()

    # Active enrollments
    active_query = select(func.count(EmployeeBenefit.id)).where(EmployeeBenefit.status == 'active')
    active_result = await db.execute(active_query)
    active_enrollments = active_result.scalar()

    # Total employee cost
    emp_cost_query = select(func.sum(EmployeeBenefit.employee_contribution)).where(EmployeeBenefit.status == 'active')
    emp_cost_result = await db.execute(emp_cost_query)
    total_employee_cost = emp_cost_result.scalar() or 0

    # Total employer cost
    employer_cost_query = select(func.sum(EmployeeBenefit.employer_contribution)).where(EmployeeBenefit.status == 'active')
    employer_cost_result = await db.execute(employer_cost_query)
    total_employer_cost = employer_cost_result.scalar() or 0

    return {
        "total_enrollments": total_enrollments,
        "active_enrollments": active_enrollments,
        "total_employee_cost_monthly": float(total_employee_cost),
        "total_employer_cost_monthly": float(total_employer_cost),
        "total_cost_monthly": float(total_employee_cost + total_employer_cost)
    }


# ============================================================================
# BONUSES
# ============================================================================

@router.get("/bonuses")
async def get_bonuses(
    employee_id: Optional[str] = None,
    bonus_type: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get bonuses"""
    query = select(Bonus)

    if employee_id:
        query = query.where(Bonus.employee_id == UUID(employee_id))
    if bonus_type:
        query = query.where(Bonus.bonus_type == bonus_type)
    if status:
        query = query.where(Bonus.status == status)

    query = query.order_by(desc(Bonus.created_at))

    result = await db.execute(query)
    bonuses = result.scalars().all()

    return [{
        "id": str(b.id),
        "employee_id": str(b.employee_id),
        "bonus_type": b.bonus_type,
        "bonus_name": b.bonus_name,
        "amount": float(b.amount) if b.amount else None,
        "currency": b.currency,
        "performance_period_start": b.performance_period_start.isoformat() if b.performance_period_start else None,
        "performance_period_end": b.performance_period_end.isoformat() if b.performance_period_end else None,
        "payout_date": b.payout_date.isoformat() if b.payout_date else None,
        "status": b.status,
        "approved_by": b.approved_by,
        "approved_at": b.approved_at.isoformat() if b.approved_at else None,
        "notes": b.notes
    } for b in bonuses]


@router.get("/bonuses/summary")
async def get_bonuses_summary(db: AsyncSession = Depends(get_db)):
    """Get bonuses summary"""
    # Total bonuses
    total_query = select(func.count(Bonus.id))
    total_result = await db.execute(total_query)
    total_bonuses = total_result.scalar()

    # Pending bonuses
    pending_query = select(func.sum(Bonus.amount)).where(Bonus.status == 'pending')
    pending_result = await db.execute(pending_query)
    pending_amount = pending_result.scalar() or 0

    # Paid bonuses (YTD)
    paid_query = select(func.sum(Bonus.amount)).where(
        and_(
            Bonus.status == 'paid',
            func.extract('year', Bonus.payout_date) == datetime.now().year
        )
    )
    paid_result = await db.execute(paid_query)
    paid_amount = paid_result.scalar() or 0

    return {
        "total_bonuses": total_bonuses,
        "pending_amount": float(pending_amount),
        "paid_ytd": float(paid_amount),
        "total_ytd": float(pending_amount + paid_amount)
    }


# ============================================================================
# COMMISSIONS
# ============================================================================

@router.get("/commissions")
async def get_commissions(
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get commissions"""
    query = select(Commission)

    if employee_id:
        query = query.where(Commission.employee_id == UUID(employee_id))
    if status:
        query = query.where(Commission.status == status)

    query = query.order_by(desc(Commission.commission_period_end))

    result = await db.execute(query)
    commissions = result.scalars().all()

    return [{
        "id": str(c.id),
        "employee_id": str(c.employee_id),
        "commission_period_start": c.commission_period_start.isoformat() if c.commission_period_start else None,
        "commission_period_end": c.commission_period_end.isoformat() if c.commission_period_end else None,
        "sales_amount": float(c.sales_amount) if c.sales_amount else None,
        "commission_rate": float(c.commission_rate) if c.commission_rate else None,
        "commission_amount": float(c.commission_amount) if c.commission_amount else None,
        "quota_amount": float(c.quota_amount) if c.quota_amount else None,
        "quota_achievement_pct": float(c.quota_achievement_pct) if c.quota_achievement_pct else None,
        "payout_date": c.payout_date.isoformat() if c.payout_date else None,
        "status": c.status,
        "approved_by": c.approved_by
    } for c in commissions]


# ============================================================================
# SALARY ADJUSTMENTS
# ============================================================================

@router.get("/salary-adjustments")
async def get_salary_adjustments(
    employee_id: Optional[str] = None,
    adjustment_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get salary adjustment history"""
    query = select(SalaryAdjustment)

    if employee_id:
        query = query.where(SalaryAdjustment.employee_id == UUID(employee_id))
    if adjustment_type:
        query = query.where(SalaryAdjustment.adjustment_type == adjustment_type)

    query = query.order_by(desc(SalaryAdjustment.effective_date))

    result = await db.execute(query)
    adjustments = result.scalars().all()

    return [{
        "id": str(a.id),
        "employee_id": str(a.employee_id),
        "adjustment_type": a.adjustment_type,
        "previous_salary": float(a.previous_salary) if a.previous_salary else None,
        "new_salary": float(a.new_salary) if a.new_salary else None,
        "adjustment_amount": float(a.adjustment_amount) if a.adjustment_amount else None,
        "adjustment_percentage": float(a.adjustment_percentage) if a.adjustment_percentage else None,
        "effective_date": a.effective_date.isoformat() if a.effective_date else None,
        "reason": a.reason,
        "approved_by": a.approved_by,
        "approved_at": a.approved_at.isoformat() if a.approved_at else None
    } for a in adjustments]


@router.get("/salary-adjustments/recent")
async def get_recent_salary_adjustments(
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Get recent salary adjustments"""
    query = select(SalaryAdjustment).order_by(desc(SalaryAdjustment.effective_date)).limit(limit)

    result = await db.execute(query)
    adjustments = result.scalars().all()

    return [{
        "id": str(a.id),
        "employee_id": str(a.employee_id),
        "adjustment_type": a.adjustment_type,
        "previous_salary": float(a.previous_salary) if a.previous_salary else None,
        "new_salary": float(a.new_salary) if a.new_salary else None,
        "adjustment_amount": float(a.adjustment_amount) if a.adjustment_amount else None,
        "adjustment_percentage": float(a.adjustment_percentage) if a.adjustment_percentage else None,
        "effective_date": a.effective_date.isoformat() if a.effective_date else None,
        "reason": a.reason,
        "approved_by": a.approved_by
    } for a in adjustments]


# ============================================================================
# COMPENSATION OVERVIEW
# ============================================================================

@router.get("/overview")
async def get_compensation_overview(db: AsyncSession = Depends(get_db)):
    """Get comprehensive compensation overview"""
    from app.models.employee import Employee

    # Total payroll
    payroll_query = select(func.sum(Employee.base_salary)).where(Employee.is_active == True)
    payroll_result = await db.execute(payroll_query)
    total_payroll = payroll_result.scalar() or 0

    # Average salary
    avg_query = select(func.avg(Employee.base_salary)).where(Employee.is_active == True)
    avg_result = await db.execute(avg_query)
    avg_salary = avg_result.scalar() or 0

    # Employee count
    count_query = select(func.count(Employee.id)).where(Employee.is_active == True)
    count_result = await db.execute(count_query)
    employee_count = count_result.scalar()

    # Benefits spend
    benefits_query = select(func.sum(EmployeeBenefit.employer_contribution)).where(EmployeeBenefit.status == 'active')
    benefits_result = await db.execute(benefits_query)
    benefits_monthly = benefits_result.scalar() or 0

    # Bonuses YTD
    bonuses_query = select(func.sum(Bonus.amount)).where(
        and_(
            Bonus.status.in_(['paid', 'approved']),
            func.extract('year', Bonus.payout_date) == datetime.now().year
        )
    )
    bonuses_result = await db.execute(bonuses_query)
    bonuses_ytd = bonuses_result.scalar() or 0

    return {
        "total_payroll": float(total_payroll) if total_payroll else 0,
        "avg_salary": float(avg_salary) if avg_salary else 0,
        "employee_count": employee_count if employee_count else 0,
        "benefits_monthly": float(benefits_monthly) if benefits_monthly else 0,
        "benefits_annual": float(benefits_monthly) * 12 if benefits_monthly else 0,
        "bonuses_ytd": float(bonuses_ytd) if bonuses_ytd else 0,
        "total_compensation": float(total_payroll if total_payroll else 0) + (float(benefits_monthly if benefits_monthly else 0) * 12) + float(bonuses_ytd if bonuses_ytd else 0)
    }


# ============================================================================
# CREATE/UPDATE/DELETE OPERATIONS
# ============================================================================

# PAY GRADES CRUD
@router.post("/pay-grades")
async def create_pay_grade(data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new pay grade"""
    pay_grade = PayGrade(
        grade_code=data["grade_code"],
        grade_name=data["grade_name"],
        grade_level=data["grade_level"],
        min_salary=data["min_salary"],
        mid_salary=data["mid_salary"],
        max_salary=data["max_salary"],
        currency=data.get("currency", "USD"),
        description=data.get("description"),
        is_active=data.get("is_active", True)
    )
    db.add(pay_grade)
    await db.commit()
    await db.refresh(pay_grade)
    
    return {"id": str(pay_grade.id), "message": "Pay grade created successfully"}


@router.put("/pay-grades/{pay_grade_id}")
async def update_pay_grade(pay_grade_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Update a pay grade"""
    result = await db.execute(select(PayGrade).where(PayGrade.id == UUID(pay_grade_id)))
    pay_grade = result.scalar_one_or_none()
    
    if not pay_grade:
        raise HTTPException(status_code=404, detail="Pay grade not found")
    
    for key, value in data.items():
        if hasattr(pay_grade, key):
            setattr(pay_grade, key, value)
    
    pay_grade.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "Pay grade updated successfully"}


@router.delete("/pay-grades/{pay_grade_id}")
async def delete_pay_grade(pay_grade_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a pay grade"""
    result = await db.execute(select(PayGrade).where(PayGrade.id == UUID(pay_grade_id)))
    pay_grade = result.scalar_one_or_none()
    
    if not pay_grade:
        raise HTTPException(status_code=404, detail="Pay grade not found")
    
    await db.delete(pay_grade)
    await db.commit()
    
    return {"message": "Pay grade deleted successfully"}


# SALARY BANDS CRUD
@router.post("/salary-bands")
async def create_salary_band(data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new salary band"""
    salary_band = SalaryBand(
        job_title=data["job_title"],
        department=data.get("department"),
        min_salary=data["min_salary"],
        mid_salary=data["mid_salary"],
        max_salary=data["max_salary"],
        currency=data.get("currency", "USD"),
        market_data_source=data.get("market_data_source"),
        is_active=data.get("is_active", True)
    )
    db.add(salary_band)
    await db.commit()
    await db.refresh(salary_band)
    
    return {"id": str(salary_band.id), "message": "Salary band created successfully"}


@router.put("/salary-bands/{salary_band_id}")
async def update_salary_band(salary_band_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Update a salary band"""
    result = await db.execute(select(SalaryBand).where(SalaryBand.id == UUID(salary_band_id)))
    salary_band = result.scalar_one_or_none()
    
    if not salary_band:
        raise HTTPException(status_code=404, detail="Salary band not found")
    
    for key, value in data.items():
        if hasattr(salary_band, key):
            setattr(salary_band, key, value)
    
    salary_band.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "Salary band updated successfully"}


@router.delete("/salary-bands/{salary_band_id}")
async def delete_salary_band(salary_band_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a salary band"""
    result = await db.execute(select(SalaryBand).where(SalaryBand.id == UUID(salary_band_id)))
    salary_band = result.scalar_one_or_none()
    
    if not salary_band:
        raise HTTPException(status_code=404, detail="Salary band not found")
    
    await db.delete(salary_band)
    await db.commit()
    
    return {"message": "Salary band deleted successfully"}


# BONUSES CRUD
@router.post("/bonuses")
async def create_bonus(data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new bonus"""
    from datetime import datetime as dt
    
    bonus = Bonus(
        employee_id=UUID(data["employee_id"]),
        bonus_type=data["bonus_type"],
        bonus_name=data["bonus_name"],
        amount=data["amount"],
        currency=data.get("currency", "USD"),
        performance_period_start=dt.fromisoformat(data["performance_period_start"]) if data.get("performance_period_start") else None,
        performance_period_end=dt.fromisoformat(data["performance_period_end"]) if data.get("performance_period_end") else None,
        payout_date=dt.fromisoformat(data["payout_date"]) if data.get("payout_date") else None,
        status=data.get("status", "pending"),
        notes=data.get("notes")
    )
    db.add(bonus)
    await db.commit()
    await db.refresh(bonus)
    
    return {"id": str(bonus.id), "message": "Bonus created successfully"}


@router.put("/bonuses/{bonus_id}")
async def update_bonus(bonus_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Update a bonus"""
    result = await db.execute(select(Bonus).where(Bonus.id == UUID(bonus_id)))
    bonus = result.scalar_one_or_none()
    
    if not bonus:
        raise HTTPException(status_code=404, detail="Bonus not found")
    
    from datetime import datetime as dt
    for key, value in data.items():
        if hasattr(bonus, key):
            if key in ["performance_period_start", "performance_period_end", "payout_date"] and value:
                setattr(bonus, key, dt.fromisoformat(value))
            elif key == "employee_id" and value:
                setattr(bonus, key, UUID(value))
            else:
                setattr(bonus, key, value)
    
    bonus.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "Bonus updated successfully"}


@router.delete("/bonuses/{bonus_id}")
async def delete_bonus(bonus_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a bonus"""
    result = await db.execute(select(Bonus).where(Bonus.id == UUID(bonus_id)))
    bonus = result.scalar_one_or_none()
    
    if not bonus:
        raise HTTPException(status_code=404, detail="Bonus not found")
    
    await db.delete(bonus)
    await db.commit()
    
    return {"message": "Bonus deleted successfully"}


# BENEFITS PLANS CRUD
@router.post("/benefits-plans")
async def create_benefits_plan(data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new benefits plan"""
    from datetime import datetime as dt
    
    benefits_plan = BenefitsPlan(
        plan_code=data["plan_code"],
        plan_name=data["plan_name"],
        plan_type=data["plan_type"],
        provider_name=data.get("provider_name"),
        coverage_level=data.get("coverage_level"),
        employee_cost_monthly=data.get("employee_cost_monthly"),
        employer_cost_monthly=data.get("employer_cost_monthly"),
        total_cost_monthly=data.get("total_cost_monthly"),
        deductible=data.get("deductible"),
        out_of_pocket_max=data.get("out_of_pocket_max"),
        is_active=data.get("is_active", True),
        effective_date=dt.fromisoformat(data["effective_date"]) if data.get("effective_date") else None
    )
    db.add(benefits_plan)
    await db.commit()
    await db.refresh(benefits_plan)
    
    return {"id": str(benefits_plan.id), "message": "Benefits plan created successfully"}


@router.put("/benefits-plans/{benefits_plan_id}")
async def update_benefits_plan(benefits_plan_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Update a benefits plan"""
    result = await db.execute(select(BenefitsPlan).where(BenefitsPlan.id == UUID(benefits_plan_id)))
    benefits_plan = result.scalar_one_or_none()
    
    if not benefits_plan:
        raise HTTPException(status_code=404, detail="Benefits plan not found")
    
    from datetime import datetime as dt
    for key, value in data.items():
        if hasattr(benefits_plan, key):
            if key in ["effective_date", "termination_date"] and value:
                setattr(benefits_plan, key, dt.fromisoformat(value))
            else:
                setattr(benefits_plan, key, value)
    
    benefits_plan.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "Benefits plan updated successfully"}


@router.delete("/benefits-plans/{benefits_plan_id}")
async def delete_benefits_plan(benefits_plan_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a benefits plan"""
    result = await db.execute(select(BenefitsPlan).where(BenefitsPlan.id == UUID(benefits_plan_id)))
    benefits_plan = result.scalar_one_or_none()
    
    if not benefits_plan:
        raise HTTPException(status_code=404, detail="Benefits plan not found")
    
    await db.delete(benefits_plan)
    await db.commit()
    
    return {"message": "Benefits plan deleted successfully"}
