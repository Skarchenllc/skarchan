from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from datetime import date

from app.core.database import get_db
from app.models.tax import TaxRate, TaxSettings, TaxPayment, TaxType
from app.schemas.tax import (
    TaxRateCreate, TaxRateUpdate, TaxRateResponse,
    TaxSettingsCreate, TaxSettingsUpdate, TaxSettingsResponse,
    TaxPaymentCreate, TaxPaymentUpdate, TaxPaymentResponse
)

router = APIRouter()


# ==================== Tax Rate Endpoints ====================

@router.post("/rates", response_model=TaxRateResponse, status_code=status.HTTP_201_CREATED)
async def create_tax_rate(
    tax_rate: TaxRateCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new tax rate"""
    db_tax_rate = TaxRate(**tax_rate.model_dump())
    db.add(db_tax_rate)
    await db.commit()
    await db.refresh(db_tax_rate)
    return db_tax_rate


@router.get("/rates", response_model=List[TaxRateResponse])
async def list_tax_rates(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    tax_type: TaxType = None,
    db: AsyncSession = Depends(get_db)
):
    """List all tax rates with optional filters"""
    query = select(TaxRate)

    if active_only:
        query = query.where(TaxRate.active == True)

    if tax_type:
        query = query.where(TaxRate.type == tax_type)

    query = query.offset(skip).limit(limit).order_by(TaxRate.name)
    result = await db.execute(query)
    tax_rates = result.scalars().all()
    return tax_rates


@router.get("/rates/{rate_id}", response_model=TaxRateResponse)
async def get_tax_rate(
    rate_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific tax rate by ID"""
    result = await db.execute(
        select(TaxRate).where(TaxRate.id == rate_id)
    )
    tax_rate = result.scalar_one_or_none()

    if not tax_rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax rate not found"
        )

    return tax_rate


@router.put("/rates/{rate_id}", response_model=TaxRateResponse)
async def update_tax_rate(
    rate_id: UUID,
    tax_rate_update: TaxRateUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing tax rate"""
    result = await db.execute(
        select(TaxRate).where(TaxRate.id == rate_id)
    )
    db_tax_rate = result.scalar_one_or_none()

    if not db_tax_rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax rate not found"
        )

    # Update fields
    update_data = tax_rate_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tax_rate, field, value)

    await db.commit()
    await db.refresh(db_tax_rate)
    return db_tax_rate


@router.delete("/rates/{rate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tax_rate(
    rate_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete a tax rate"""
    result = await db.execute(
        select(TaxRate).where(TaxRate.id == rate_id)
    )
    db_tax_rate = result.scalar_one_or_none()

    if not db_tax_rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax rate not found"
        )

    await db.delete(db_tax_rate)
    await db.commit()
    return None


# ==================== Tax Settings Endpoints ====================

@router.get("/settings", response_model=TaxSettingsResponse)
async def get_tax_settings(db: AsyncSession = Depends(get_db)):
    """Get current tax settings"""
    result = await db.execute(select(TaxSettings))
    settings = result.scalar_one_or_none()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax settings not found. Please create initial settings."
        )

    return settings


@router.post("/settings", response_model=TaxSettingsResponse, status_code=status.HTTP_201_CREATED)
async def create_tax_settings(
    settings: TaxSettingsCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create initial tax settings"""
    # Check if settings already exist
    result = await db.execute(select(TaxSettings))
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tax settings already exist. Use PUT to update."
        )

    db_settings = TaxSettings(**settings.model_dump())
    db.add(db_settings)
    await db.commit()
    await db.refresh(db_settings)
    return db_settings


@router.put("/settings", response_model=TaxSettingsResponse)
async def update_tax_settings(
    settings_update: TaxSettingsUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update tax settings"""
    result = await db.execute(select(TaxSettings))
    db_settings = result.scalar_one_or_none()

    if not db_settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax settings not found. Please create initial settings."
        )

    # Update fields
    update_data = settings_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_settings, field, value)

    await db.commit()
    await db.refresh(db_settings)
    return db_settings


# ==================== Tax Payment Endpoints ====================

@router.post("/payments", response_model=TaxPaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_tax_payment(
    payment: TaxPaymentCreate,
    db: AsyncSession = Depends(get_db)
):
    """Record a new tax payment"""
    db_payment = TaxPayment(**payment.model_dump())
    db.add(db_payment)
    await db.commit()
    await db.refresh(db_payment)
    return db_payment


@router.get("/payments", response_model=List[TaxPaymentResponse])
async def list_tax_payments(
    skip: int = 0,
    limit: int = 100,
    tax_type: TaxType = None,
    start_date: date = None,
    end_date: date = None,
    db: AsyncSession = Depends(get_db)
):
    """List all tax payments with optional filters"""
    query = select(TaxPayment)

    if tax_type:
        query = query.where(TaxPayment.tax_type == tax_type)

    if start_date:
        query = query.where(TaxPayment.payment_date >= start_date)

    if end_date:
        query = query.where(TaxPayment.payment_date <= end_date)

    query = query.offset(skip).limit(limit).order_by(TaxPayment.payment_date.desc())
    result = await db.execute(query)
    payments = result.scalars().all()
    return payments


@router.get("/payments/summary")
async def get_payments_summary(
    tax_type: TaxType = None,
    start_date: date = None,
    end_date: date = None,
    db: AsyncSession = Depends(get_db)
):
    """Get summary of tax payments"""
    query = select(TaxPayment)

    if tax_type:
        query = query.where(TaxPayment.tax_type == tax_type)

    if start_date:
        query = query.where(TaxPayment.payment_date >= start_date)

    if end_date:
        query = query.where(TaxPayment.payment_date <= end_date)

    result = await db.execute(query)
    payments = result.scalars().all()

    total_paid = sum(payment.amount_paid for payment in payments)

    # Group by tax type
    by_tax_type = {}
    for payment in payments:
        tax_type_str = payment.tax_type.value
        if tax_type_str not in by_tax_type:
            by_tax_type[tax_type_str] = 0
        by_tax_type[tax_type_str] += payment.amount_paid

    return {
        "total_payments": len(payments),
        "total_amount_paid": total_paid,
        "by_tax_type": by_tax_type
    }


@router.get("/payments/{payment_id}", response_model=TaxPaymentResponse)
async def get_tax_payment(
    payment_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific tax payment by ID"""
    result = await db.execute(
        select(TaxPayment).where(TaxPayment.id == payment_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax payment not found"
        )

    return payment


@router.put("/payments/{payment_id}", response_model=TaxPaymentResponse)
async def update_tax_payment(
    payment_id: UUID,
    payment_update: TaxPaymentUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing tax payment"""
    result = await db.execute(
        select(TaxPayment).where(TaxPayment.id == payment_id)
    )
    db_payment = result.scalar_one_or_none()

    if not db_payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax payment not found"
        )

    # Update fields
    update_data = payment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_payment, field, value)

    await db.commit()
    await db.refresh(db_payment)
    return db_payment


@router.delete("/payments/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tax_payment(
    payment_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete a tax payment"""
    result = await db.execute(
        select(TaxPayment).where(TaxPayment.id == payment_id)
    )
    db_payment = result.scalar_one_or_none()

    if not db_payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax payment not found"
        )

    await db.delete(db_payment)
    await db.commit()
    return None
