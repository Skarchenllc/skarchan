from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func, extract
from typing import List, Optional
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
from uuid import UUID

from app.core.database import get_db
from app.models.period import AccountingPeriod, PeriodClosing, YearEndClosing, PeriodAdjustment
from app.schemas.period import (
    AccountingPeriodCreate,
    AccountingPeriodUpdate,
    AccountingPeriodResponse,
    PeriodClosingCreate,
    PeriodClosingUpdate,
    PeriodClosingResponse,
    YearEndClosingCreate,
    YearEndClosingUpdate,
    YearEndClosingResponse,
    PeriodAdjustmentCreate,
    PeriodAdjustmentUpdate,
    PeriodAdjustmentResponse,
    PeriodCloseRequest,
    PeriodReopenRequest,
    PeriodLockRequest,
    BulkPeriodCreate,
    PeriodSummary,
)

router = APIRouter()


# ==================== Accounting Period Endpoints ====================

@router.get("/periods", response_model=List[AccountingPeriodResponse])
async def get_periods(
    fiscal_year: Optional[int] = None,
    status: Optional[str] = None,
    period_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all accounting periods with optional filters"""
    query = select(AccountingPeriod)

    if fiscal_year:
        query = query.where(AccountingPeriod.fiscal_year == fiscal_year)

    if status:
        query = query.where(AccountingPeriod.status == status)

    if period_type:
        query = query.where(AccountingPeriod.period_type == period_type)

    query = query.order_by(AccountingPeriod.start_date.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/periods/{period_id}", response_model=AccountingPeriodResponse)
async def get_period(period_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific accounting period by ID"""
    result = await db.execute(
        select(AccountingPeriod).where(AccountingPeriod.id == period_id)
    )
    period = result.scalar_one_or_none()

    if not period:
        raise HTTPException(status_code=404, detail="Period not found")

    return period


@router.post("/periods", response_model=AccountingPeriodResponse)
async def create_period(
    period: AccountingPeriodCreate,
    created_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a new accounting period"""
    # Check if period code already exists
    existing = await db.execute(
        select(AccountingPeriod).where(AccountingPeriod.period_code == period.period_code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"Period with code {period.period_code} already exists"
        )

    # Check for overlapping periods
    overlap_check = await db.execute(
        select(AccountingPeriod).where(
            and_(
                AccountingPeriod.fiscal_year == period.fiscal_year,
                or_(
                    and_(
                        AccountingPeriod.start_date <= period.start_date,
                        AccountingPeriod.end_date >= period.start_date
                    ),
                    and_(
                        AccountingPeriod.start_date <= period.end_date,
                        AccountingPeriod.end_date >= period.end_date
                    )
                )
            )
        )
    )
    if overlap_check.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Period dates overlap with an existing period"
        )

    db_period = AccountingPeriod(**period.model_dump(), created_by=created_by)
    db.add(db_period)
    await db.commit()
    await db.refresh(db_period)

    return db_period


@router.put("/periods/{period_id}", response_model=AccountingPeriodResponse)
async def update_period(
    period_id: UUID,
    period: AccountingPeriodUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an accounting period"""
    result = await db.execute(
        select(AccountingPeriod).where(AccountingPeriod.id == period_id)
    )
    db_period = result.scalar_one_or_none()

    if not db_period:
        raise HTTPException(status_code=404, detail="Period not found")

    # Don't allow updates to locked periods
    if db_period.status == "locked":
        raise HTTPException(
            status_code=400,
            detail="Cannot update locked period"
        )

    update_data = period.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_period, field, value)

    db_period.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(db_period)

    return db_period


@router.post("/periods/{period_id}/close", response_model=AccountingPeriodResponse)
async def close_period(
    period_id: UUID,
    close_request: PeriodCloseRequest,
    db: AsyncSession = Depends(get_db)
):
    """Close an accounting period"""
    result = await db.execute(
        select(AccountingPeriod).where(AccountingPeriod.id == period_id)
    )
    db_period = result.scalar_one_or_none()

    if not db_period:
        raise HTTPException(status_code=404, detail="Period not found")

    if db_period.status != "open":
        raise HTTPException(
            status_code=400,
            detail=f"Only open periods can be closed. Current status: {db_period.status}"
        )

    # Check if all closing checklist items are completed
    incomplete_items = await db.execute(
        select(func.count(PeriodClosing.id)).where(
            and_(
                PeriodClosing.period_id == period_id,
                PeriodClosing.is_completed == False
            )
        )
    )
    incomplete_count = incomplete_items.scalar()

    if incomplete_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot close period. {incomplete_count} checklist items are incomplete"
        )

    db_period.status = "closed"
    db_period.closed_by = close_request.closed_by
    db_period.closed_at = datetime.utcnow()
    db_period.closing_notes = close_request.closing_notes

    await db.commit()
    await db.refresh(db_period)

    return db_period


@router.post("/periods/{period_id}/reopen", response_model=AccountingPeriodResponse)
async def reopen_period(
    period_id: UUID,
    reopen_request: PeriodReopenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Reopen a closed accounting period"""
    result = await db.execute(
        select(AccountingPeriod).where(AccountingPeriod.id == period_id)
    )
    db_period = result.scalar_one_or_none()

    if not db_period:
        raise HTTPException(status_code=404, detail="Period not found")

    if db_period.status == "locked":
        raise HTTPException(
            status_code=400,
            detail="Cannot reopen locked period"
        )

    if db_period.status != "closed":
        raise HTTPException(
            status_code=400,
            detail=f"Only closed periods can be reopened. Current status: {db_period.status}"
        )

    db_period.status = "open"
    db_period.closing_notes = f"{db_period.closing_notes}\n\nReopened by {reopen_request.reopened_by}: {reopen_request.reason}"
    db_period.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(db_period)

    return db_period


@router.post("/periods/{period_id}/lock", response_model=AccountingPeriodResponse)
async def lock_period(
    period_id: UUID,
    lock_request: PeriodLockRequest,
    db: AsyncSession = Depends(get_db)
):
    """Lock an accounting period (cannot be reopened)"""
    result = await db.execute(
        select(AccountingPeriod).where(AccountingPeriod.id == period_id)
    )
    db_period = result.scalar_one_or_none()

    if not db_period:
        raise HTTPException(status_code=404, detail="Period not found")

    if db_period.status != "closed":
        raise HTTPException(
            status_code=400,
            detail="Only closed periods can be locked"
        )

    db_period.status = "locked"
    db_period.locked_by = lock_request.locked_by
    db_period.locked_at = datetime.utcnow()
    db_period.locked_notes = lock_request.locked_notes

    await db.commit()
    await db.refresh(db_period)

    return db_period


@router.post("/periods/bulk-create")
async def create_bulk_periods(
    bulk_data: BulkPeriodCreate,
    created_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Create all periods for a fiscal year (monthly or quarterly)"""
    created_periods = []

    # Create year-level period if requested
    if bulk_data.create_year_period:
        year_period = AccountingPeriod(
            period_name=bulk_data.fiscal_year_name,
            period_code=f"FY{bulk_data.fiscal_year}",
            period_type="year",
            fiscal_year=bulk_data.fiscal_year,
            fiscal_year_name=bulk_data.fiscal_year_name,
            start_date=bulk_data.start_date,
            end_date=bulk_data.end_date,
            created_by=created_by
        )
        db.add(year_period)
        await db.flush()
        created_periods.append(year_period)
        parent_id = year_period.id
    else:
        parent_id = None

    # Create monthly or quarterly periods
    current_date = bulk_data.start_date

    if bulk_data.period_type == "month":
        period_count = 12
        for i in range(1, period_count + 1):
            period_end = current_date + relativedelta(months=1, days=-1)
            if period_end > bulk_data.end_date:
                period_end = bulk_data.end_date

            month_period = AccountingPeriod(
                period_name=f"{current_date.strftime('%B %Y')}",
                period_code=f"FY{bulk_data.fiscal_year}-M{i:02d}",
                period_type="month",
                fiscal_year=bulk_data.fiscal_year,
                fiscal_year_name=bulk_data.fiscal_year_name,
                start_date=current_date,
                end_date=period_end,
                parent_period_id=parent_id,
                period_number=i,
                created_by=created_by
            )
            db.add(month_period)
            created_periods.append(month_period)

            current_date = period_end + timedelta(days=1)
            if current_date > bulk_data.end_date:
                break

    elif bulk_data.period_type == "quarter":
        period_count = 4
        for i in range(1, period_count + 1):
            period_end = current_date + relativedelta(months=3, days=-1)
            if period_end > bulk_data.end_date:
                period_end = bulk_data.end_date

            quarter_period = AccountingPeriod(
                period_name=f"Q{i} {bulk_data.fiscal_year}",
                period_code=f"FY{bulk_data.fiscal_year}-Q{i}",
                period_type="quarter",
                fiscal_year=bulk_data.fiscal_year,
                fiscal_year_name=bulk_data.fiscal_year_name,
                start_date=current_date,
                end_date=period_end,
                parent_period_id=parent_id,
                period_number=i,
                created_by=created_by
            )
            db.add(quarter_period)
            created_periods.append(quarter_period)

            current_date = period_end + timedelta(days=1)
            if current_date > bulk_data.end_date:
                break

    await db.commit()

    return {
        "message": f"Created {len(created_periods)} periods for {bulk_data.fiscal_year_name}",
        "periods_created": len(created_periods),
        "fiscal_year": bulk_data.fiscal_year
    }


# ==================== Period Closing Checklist Endpoints ====================

@router.get("/periods/{period_id}/checklist", response_model=List[PeriodClosingResponse])
async def get_period_checklist(period_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get closing checklist for a period"""
    query = select(PeriodClosing).where(
        PeriodClosing.period_id == period_id
    ).order_by(PeriodClosing.step_order)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/periods/{period_id}/checklist", response_model=PeriodClosingResponse)
async def add_checklist_item(
    period_id: UUID,
    item: PeriodClosingCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add a closing checklist item"""
    # Verify period exists
    period_result = await db.execute(
        select(AccountingPeriod).where(AccountingPeriod.id == period_id)
    )
    if not period_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Period not found")

    db_item = PeriodClosing(**item.model_dump())
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)

    return db_item


@router.put("/checklist/{item_id}", response_model=PeriodClosingResponse)
async def update_checklist_item(
    item_id: UUID,
    item: PeriodClosingUpdate,
    completed_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Update a checklist item"""
    result = await db.execute(
        select(PeriodClosing).where(PeriodClosing.id == item_id)
    )
    db_item = result.scalar_one_or_none()

    if not db_item:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    update_data = item.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)

    if item.is_completed and not db_item.is_completed:
        db_item.completed_by = completed_by
        db_item.completed_at = datetime.utcnow()

    db_item.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(db_item)

    return db_item


# ==================== Year End Closing Endpoints ====================

@router.get("/year-end-closings", response_model=List[YearEndClosingResponse])
async def get_year_end_closings(
    fiscal_year: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get year-end closing records"""
    query = select(YearEndClosing)

    if fiscal_year:
        query = query.where(YearEndClosing.fiscal_year == fiscal_year)

    query = query.order_by(desc(YearEndClosing.fiscal_year))
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/year-end-closings", response_model=YearEndClosingResponse)
async def create_year_end_closing(
    closing: YearEndClosingCreate,
    closed_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Create year-end closing record"""
    # Check if already exists
    existing = await db.execute(
        select(YearEndClosing).where(YearEndClosing.fiscal_year == closing.fiscal_year)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"Year-end closing for FY{closing.fiscal_year} already exists"
        )

    db_closing = YearEndClosing(**closing.model_dump(), closed_by=closed_by)
    db.add(db_closing)
    await db.commit()
    await db.refresh(db_closing)

    return db_closing


@router.put("/year-end-closings/{closing_id}", response_model=YearEndClosingResponse)
async def update_year_end_closing(
    closing_id: UUID,
    closing: YearEndClosingUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update year-end closing"""
    result = await db.execute(
        select(YearEndClosing).where(YearEndClosing.id == closing_id)
    )
    db_closing = result.scalar_one_or_none()

    if not db_closing:
        raise HTTPException(status_code=404, detail="Year-end closing not found")

    update_data = closing.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_closing, field, value)

    db_closing.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(db_closing)

    return db_closing


# ==================== Period Adjustment Endpoints ====================

@router.get("/periods/{period_id}/adjustments", response_model=List[PeriodAdjustmentResponse])
async def get_period_adjustments(
    period_id: UUID,
    approved_only: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get adjustments for a period"""
    query = select(PeriodAdjustment).where(PeriodAdjustment.period_id == period_id)

    if approved_only is not None:
        if approved_only:
            query = query.where(PeriodAdjustment.approved_by.isnot(None))
        else:
            query = query.where(PeriodAdjustment.approved_by.is_(None))

    query = query.order_by(desc(PeriodAdjustment.created_at))
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/adjustments", response_model=PeriodAdjustmentResponse)
async def create_period_adjustment(
    adjustment: PeriodAdjustmentCreate,
    created_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a period adjustment"""
    # Verify period exists and allows adjustments
    period_result = await db.execute(
        select(AccountingPeriod).where(AccountingPeriod.id == adjustment.period_id)
    )
    period = period_result.scalar_one_or_none()

    if not period:
        raise HTTPException(status_code=404, detail="Period not found")

    if period.status == "locked":
        raise HTTPException(
            status_code=400,
            detail="Cannot create adjustments for locked periods"
        )

    if period.status == "closed" and not period.allow_adjustments:
        raise HTTPException(
            status_code=400,
            detail="Period does not allow adjustments"
        )

    db_adjustment = PeriodAdjustment(**adjustment.model_dump(), created_by=created_by)
    db.add(db_adjustment)

    # Increment adjustment count
    period.adjustment_count += 1

    await db.commit()
    await db.refresh(db_adjustment)

    return db_adjustment


@router.put("/adjustments/{adjustment_id}/approve", response_model=PeriodAdjustmentResponse)
async def approve_period_adjustment(
    adjustment_id: UUID,
    approval: PeriodAdjustmentUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Approve a period adjustment"""
    result = await db.execute(
        select(PeriodAdjustment).where(PeriodAdjustment.id == adjustment_id)
    )
    db_adjustment = result.scalar_one_or_none()

    if not db_adjustment:
        raise HTTPException(status_code=404, detail="Adjustment not found")

    if db_adjustment.approved_by:
        raise HTTPException(
            status_code=400,
            detail="Adjustment has already been approved"
        )

    db_adjustment.approved_by = approval.approved_by
    db_adjustment.approved_at = datetime.utcnow()
    db_adjustment.approval_notes = approval.approval_notes

    await db.commit()
    await db.refresh(db_adjustment)

    return db_adjustment
