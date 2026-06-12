from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func
from typing import List, Optional
from datetime import date, datetime
from uuid import UUID

from app.core.database import get_db
from app.models.budget import Budget, BudgetLine, BudgetRevision, BudgetAlert, BudgetScenario, BudgetTemplate
from app.models.account import Account
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetLineCreate,
    BudgetLineUpdate,
    BudgetLineResponse,
    BudgetLineWithAccount,
    BudgetRevisionCreate,
    BudgetRevisionResponse,
    BudgetAlertCreate,
    BudgetAlertResponse,
    BudgetScenarioCreate,
    BudgetScenarioUpdate,
    BudgetScenarioResponse,
    BudgetTemplateCreate,
    BudgetTemplateUpdate,
    BudgetTemplateResponse,
    BudgetSummary,
    BudgetApproval,
    BulkBudgetLineCreate,
)

router = APIRouter()


# ==================== Budget Endpoints ====================

@router.get("/budgets", response_model=List[BudgetResponse])
async def get_budgets(
    status: Optional[str] = None,
    budget_type: Optional[str] = None,
    department: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all budgets with optional filters"""
    query = select(Budget)

    if status:
        query = query.where(Budget.status == status)

    if budget_type:
        query = query.where(Budget.budget_type == budget_type)

    if department:
        query = query.where(Budget.department == department)

    query = query.order_by(desc(Budget.created_at))
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/budgets/{budget_id}", response_model=BudgetResponse)
async def get_budget(budget_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific budget by ID"""
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id)
    )
    budget = result.scalar_one_or_none()

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    return budget


@router.post("/budgets", response_model=BudgetResponse)
async def create_budget(
    budget: BudgetCreate,
    created_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a new budget"""
    # Check if budget code already exists
    existing = await db.execute(
        select(Budget).where(Budget.budget_code == budget.budget_code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"Budget with code {budget.budget_code} already exists"
        )

    db_budget = Budget(**budget.model_dump(), created_by=created_by)
    db.add(db_budget)
    await db.commit()
    await db.refresh(db_budget)

    return db_budget


@router.put("/budgets/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: UUID,
    budget: BudgetUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a budget"""
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id)
    )
    db_budget = result.scalar_one_or_none()

    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    update_data = budget.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_budget, field, value)

    db_budget.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(db_budget)

    return db_budget


@router.post("/budgets/{budget_id}/approve", response_model=BudgetResponse)
async def approve_budget(
    budget_id: UUID,
    approval: BudgetApproval,
    db: AsyncSession = Depends(get_db)
):
    """Approve a budget"""
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id)
    )
    db_budget = result.scalar_one_or_none()

    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    if db_budget.status != "draft":
        raise HTTPException(
            status_code=400,
            detail="Only draft budgets can be approved"
        )

    db_budget.status = "active"
    db_budget.approved_by = approval.approved_by
    db_budget.approved_at = datetime.utcnow()
    if approval.notes:
        db_budget.notes = approval.notes

    await db.commit()
    await db.refresh(db_budget)

    return db_budget


@router.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: UUID, db: AsyncSession = Depends(get_db)):
    """Archive a budget (soft delete)"""
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id)
    )
    db_budget = result.scalar_one_or_none()

    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    db_budget.status = "archived"
    await db.commit()

    return {"message": "Budget archived successfully"}


# ==================== Budget Line Endpoints ====================

@router.get("/budgets/{budget_id}/lines", response_model=List[BudgetLineWithAccount])
async def get_budget_lines(budget_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get all budget lines for a budget with account details"""
    # Verify budget exists
    budget_result = await db.execute(
        select(Budget).where(Budget.id == budget_id)
    )
    if not budget_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Budget not found")

    # Get budget lines with account details
    query = select(BudgetLine, Account).join(
        Account, BudgetLine.account_id == Account.id
    ).where(BudgetLine.budget_id == budget_id)

    result = await db.execute(query)
    rows = result.all()

    budget_lines = []
    for budget_line, account in rows:
        line_dict = {
            **budget_line.__dict__,
            "account_code": account.code,
            "account_name": account.name,
            "account_type": account.type
        }
        budget_lines.append(BudgetLineWithAccount(**line_dict))

    return budget_lines


@router.post("/budgets/{budget_id}/lines", response_model=BudgetLineResponse)
async def create_budget_line(
    budget_id: UUID,
    budget_line: BudgetLineCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a budget line"""
    # Verify budget exists
    budget_result = await db.execute(
        select(Budget).where(Budget.id == budget_id)
    )
    db_budget = budget_result.scalar_one_or_none()
    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    # Verify account exists
    account_result = await db.execute(
        select(Account).where(Account.id == budget_line.account_id)
    )
    if not account_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Account not found")

    # Create budget line
    db_line = BudgetLine(**budget_line.model_dump())
    db_line.available_amount = db_line.budgeted_amount  # Initially all budget is available
    db.add(db_line)

    # Update budget total
    db_budget.total_budget_amount = (db_budget.total_budget_amount or 0) + db_line.budgeted_amount

    await db.commit()
    await db.refresh(db_line)

    return db_line


@router.post("/budgets/{budget_id}/lines/bulk")
async def create_bulk_budget_lines(
    budget_id: UUID,
    bulk_data: BulkBudgetLineCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create multiple budget lines at once"""
    # Verify budget exists
    budget_result = await db.execute(
        select(Budget).where(Budget.id == budget_id)
    )
    db_budget = budget_result.scalar_one_or_none()
    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    created_lines = []
    total_budget = 0

    for line_data in bulk_data.lines:
        # Verify account exists
        account_result = await db.execute(
            select(Account).where(Account.id == line_data.get("account_id"))
        )
        if not account_result.scalar_one_or_none():
            continue  # Skip invalid accounts

        db_line = BudgetLine(
            budget_id=budget_id,
            account_id=line_data.get("account_id"),
            budgeted_amount=line_data.get("budgeted_amount", 0),
            available_amount=line_data.get("budgeted_amount", 0),
            notes=line_data.get("notes")
        )
        db.add(db_line)
        created_lines.append(db_line)
        total_budget += db_line.budgeted_amount

    # Update budget total
    db_budget.total_budget_amount = (db_budget.total_budget_amount or 0) + total_budget

    await db.commit()

    return {
        "message": f"Created {len(created_lines)} budget lines",
        "total_budget_added": total_budget
    }


@router.put("/budget-lines/{line_id}", response_model=BudgetLineResponse)
async def update_budget_line(
    line_id: UUID,
    budget_line: BudgetLineUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a budget line"""
    result = await db.execute(
        select(BudgetLine).where(BudgetLine.id == line_id)
    )
    db_line = result.scalar_one_or_none()

    if not db_line:
        raise HTTPException(status_code=404, detail="Budget line not found")

    old_budgeted = db_line.budgeted_amount

    update_data = budget_line.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_line, field, value)

    # Recalculate available amount if budgeted amount changed
    if "budgeted_amount" in update_data:
        db_line.available_amount = db_line.budgeted_amount - db_line.actual_amount - db_line.committed_amount

        # Update budget total
        budget_result = await db.execute(
            select(Budget).where(Budget.id == db_line.budget_id)
        )
        db_budget = budget_result.scalar_one_or_none()
        if db_budget:
            diff = db_line.budgeted_amount - old_budgeted
            db_budget.total_budget_amount = (db_budget.total_budget_amount or 0) + diff

    db_line.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(db_line)

    return db_line


# ==================== Budget Summary and Reports ====================

@router.get("/budgets/{budget_id}/summary", response_model=BudgetSummary)
async def get_budget_summary(budget_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get budget summary with totals and performance metrics"""
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id)
    )
    budget = result.scalar_one_or_none()

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    # Get aggregated line totals
    lines_result = await db.execute(
        select(
            func.sum(BudgetLine.budgeted_amount).label("total_budgeted"),
            func.sum(BudgetLine.actual_amount).label("total_actual"),
            func.sum(BudgetLine.committed_amount).label("total_committed"),
            func.sum(BudgetLine.available_amount).label("total_available"),
        ).where(BudgetLine.budget_id == budget_id)
    )
    totals = lines_result.one()

    total_budgeted = totals.total_budgeted or 0
    total_actual = totals.total_actual or 0
    total_committed = totals.total_committed or 0
    total_available = totals.total_available or 0
    total_variance = total_budgeted - total_actual
    variance_percentage = (total_variance / total_budgeted * 100) if total_budgeted > 0 else 0
    utilization_percentage = (total_actual / total_budgeted * 100) if total_budgeted > 0 else 0

    return BudgetSummary(
        budget_id=budget.id,
        budget_code=budget.budget_code,
        budget_name=budget.name,
        total_budgeted=total_budgeted,
        total_actual=total_actual,
        total_committed=total_committed,
        total_available=total_available,
        total_variance=total_variance,
        variance_percentage=variance_percentage,
        utilization_percentage=utilization_percentage,
        status=budget.status
    )


# ==================== Budget Templates ====================

@router.get("/budget-templates", response_model=List[BudgetTemplateResponse])
async def get_budget_templates(
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get budget templates"""
    query = select(BudgetTemplate)

    if category:
        query = query.where(BudgetTemplate.category == category)

    if is_active is not None:
        query = query.where(BudgetTemplate.is_active == is_active)

    query = query.order_by(BudgetTemplate.template_name)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/budget-templates", response_model=BudgetTemplateResponse)
async def create_budget_template(
    template: BudgetTemplateCreate,
    created_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a budget template"""
    db_template = BudgetTemplate(**template.model_dump(), created_by=created_by)
    db.add(db_template)
    await db.commit()
    await db.refresh(db_template)

    return db_template


# ==================== Budget Scenarios ====================

@router.get("/budget-scenarios", response_model=List[BudgetScenarioResponse])
async def get_budget_scenarios(
    base_budget_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get budget scenarios"""
    query = select(BudgetScenario)

    if base_budget_id:
        query = query.where(BudgetScenario.base_budget_id == base_budget_id)

    query = query.order_by(desc(BudgetScenario.created_at))
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/budget-scenarios", response_model=BudgetScenarioResponse)
async def create_budget_scenario(
    scenario: BudgetScenarioCreate,
    created_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a budget scenario for what-if analysis"""
    db_scenario = BudgetScenario(**scenario.model_dump(), created_by=created_by)
    db.add(db_scenario)
    await db.commit()
    await db.refresh(db_scenario)

    return db_scenario


# ==================== Budget Alerts ====================

@router.get("/budgets/{budget_id}/alerts", response_model=List[BudgetAlertResponse])
async def get_budget_alerts(
    budget_id: UUID,
    is_resolved: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get budget alerts"""
    query = select(BudgetAlert).where(BudgetAlert.budget_id == budget_id)

    if is_resolved is not None:
        query = query.where(BudgetAlert.is_resolved == is_resolved)

    query = query.order_by(desc(BudgetAlert.triggered_at))
    result = await db.execute(query)
    return result.scalars().all()
