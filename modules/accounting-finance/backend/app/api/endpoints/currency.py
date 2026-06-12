from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func
from typing import List, Optional
from datetime import date, datetime, timedelta
from uuid import UUID

from app.core.database import get_db
from app.models.currency import Currency, ExchangeRate, CurrencyExchangeTransaction, UnrealizedGainLoss
from app.schemas.currency import (
    CurrencyCreate,
    CurrencyUpdate,
    CurrencyResponse,
    ExchangeRateCreate,
    ExchangeRateUpdate,
    ExchangeRateResponse,
    CurrencyExchangeTransactionCreate,
    CurrencyExchangeTransactionUpdate,
    CurrencyExchangeTransactionResponse,
    UnrealizedGainLossCreate,
    UnrealizedGainLossResponse,
    CurrencyConversionRequest,
    CurrencyConversionResponse,
    BulkExchangeRateUpdate,
)
from app.services.exchange_rate_fetcher import get_exchange_rate_fetcher

router = APIRouter()


# ==================== Currency Endpoints ====================

@router.get("/currencies", response_model=List[CurrencyResponse])
async def get_currencies(
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all currencies"""
    query = select(Currency)

    if is_active is not None:
        query = query.where(Currency.is_active == is_active)

    query = query.order_by(Currency.code)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/currencies/{currency_id}", response_model=CurrencyResponse)
async def get_currency(currency_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific currency by ID"""
    result = await db.execute(
        select(Currency).where(Currency.id == currency_id)
    )
    currency = result.scalar_one_or_none()

    if not currency:
        raise HTTPException(status_code=404, detail="Currency not found")

    return currency


@router.get("/currencies/code/{code}", response_model=CurrencyResponse)
async def get_currency_by_code(code: str, db: AsyncSession = Depends(get_db)):
    """Get a specific currency by code"""
    result = await db.execute(
        select(Currency).where(Currency.code == code.upper())
    )
    currency = result.scalar_one_or_none()

    if not currency:
        raise HTTPException(status_code=404, detail=f"Currency {code} not found")

    return currency


@router.post("/currencies", response_model=CurrencyResponse)
async def create_currency(
    currency: CurrencyCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new currency"""
    # Check if currency code already exists
    existing = await db.execute(
        select(Currency).where(Currency.code == currency.code.upper())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"Currency with code {currency.code} already exists"
        )

    # If setting as base currency, unset any existing base currency
    if currency.is_base_currency:
        await db.execute(
            select(Currency).where(Currency.is_base_currency == True)
        )
        existing_base = await db.execute(
            select(Currency).where(Currency.is_base_currency == True)
        )
        for base_curr in existing_base.scalars().all():
            base_curr.is_base_currency = False

    db_currency = Currency(**currency.model_dump())
    db.add(db_currency)
    await db.commit()
    await db.refresh(db_currency)

    return db_currency


@router.put("/currencies/{currency_id}", response_model=CurrencyResponse)
async def update_currency(
    currency_id: UUID,
    currency: CurrencyUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a currency"""
    result = await db.execute(
        select(Currency).where(Currency.id == currency_id)
    )
    db_currency = result.scalar_one_or_none()

    if not db_currency:
        raise HTTPException(status_code=404, detail="Currency not found")

    # If setting as base currency, unset any existing base currency
    if currency.is_base_currency:
        existing_base_result = await db.execute(
            select(Currency).where(
                and_(
                    Currency.is_base_currency == True,
                    Currency.id != currency_id
                )
            )
        )
        for base_curr in existing_base_result.scalars().all():
            base_curr.is_base_currency = False

    update_data = currency.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_currency, field, value)

    db_currency.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(db_currency)

    return db_currency


@router.delete("/currencies/{currency_id}")
async def delete_currency(currency_id: UUID, db: AsyncSession = Depends(get_db)):
    """Deactivate a currency (soft delete)"""
    result = await db.execute(
        select(Currency).where(Currency.id == currency_id)
    )
    db_currency = result.scalar_one_or_none()

    if not db_currency:
        raise HTTPException(status_code=404, detail="Currency not found")

    if db_currency.is_base_currency:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate base currency"
        )

    db_currency.is_active = False
    await db.commit()

    return {"message": "Currency deactivated successfully"}


# ==================== Exchange Rate Endpoints ====================

@router.get("/exchange-rates", response_model=List[ExchangeRateResponse])
async def get_exchange_rates(
    from_currency: Optional[str] = None,
    to_currency: Optional[str] = None,
    effective_date: Optional[date] = None,
    limit: int = Query(100, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get exchange rates with optional filters"""
    query = select(ExchangeRate)

    if from_currency:
        query = query.where(ExchangeRate.from_currency_code == from_currency.upper())

    if to_currency:
        query = query.where(ExchangeRate.to_currency_code == to_currency.upper())

    if effective_date:
        query = query.where(ExchangeRate.effective_date == effective_date)

    query = query.order_by(desc(ExchangeRate.effective_date)).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/exchange-rates", response_model=ExchangeRateResponse)
async def create_exchange_rate(
    exchange_rate: ExchangeRateCreate,
    created_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a new exchange rate"""
    # Verify both currencies exist
    from_curr_result = await db.execute(
        select(Currency).where(Currency.code == exchange_rate.from_currency_code.upper())
    )
    to_curr_result = await db.execute(
        select(Currency).where(Currency.code == exchange_rate.to_currency_code.upper())
    )

    if not from_curr_result.scalar_one_or_none():
        raise HTTPException(
            status_code=404,
            detail=f"Currency {exchange_rate.from_currency_code} not found"
        )

    if not to_curr_result.scalar_one_or_none():
        raise HTTPException(
            status_code=404,
            detail=f"Currency {exchange_rate.to_currency_code} not found"
        )

    # Calculate inverse rate
    inverse_rate = 1 / exchange_rate.rate

    db_rate = ExchangeRate(
        **exchange_rate.model_dump(),
        inverse_rate=inverse_rate,
        created_by=created_by
    )
    db.add(db_rate)
    await db.commit()
    await db.refresh(db_rate)

    return db_rate


@router.post("/exchange-rates/bulk", response_model=dict)
async def bulk_update_exchange_rates(
    bulk_update: BulkExchangeRateUpdate,
    created_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Bulk update exchange rates from a base currency"""
    # Verify base currency exists
    base_curr_result = await db.execute(
        select(Currency).where(Currency.code == bulk_update.base_currency_code.upper())
    )

    if not base_curr_result.scalar_one_or_none():
        raise HTTPException(
            status_code=404,
            detail=f"Base currency {bulk_update.base_currency_code} not found"
        )

    created_rates = []

    for currency_code, rate in bulk_update.rates.items():
        # Verify target currency exists
        target_curr_result = await db.execute(
            select(Currency).where(Currency.code == currency_code)
        )

        if not target_curr_result.scalar_one_or_none():
            continue  # Skip if currency doesn't exist

        inverse_rate = 1 / rate

        db_rate = ExchangeRate(
            from_currency_code=bulk_update.base_currency_code.upper(),
            to_currency_code=currency_code,
            rate=rate,
            inverse_rate=inverse_rate,
            effective_date=bulk_update.effective_date,
            source=bulk_update.source,
            created_by=created_by
        )
        db.add(db_rate)
        created_rates.append(currency_code)

    await db.commit()

    return {
        "message": f"Created {len(created_rates)} exchange rates",
        "currencies": created_rates
    }


@router.get("/exchange-rates/latest/{from_currency}/{to_currency}", response_model=ExchangeRateResponse)
async def get_latest_exchange_rate(
    from_currency: str,
    to_currency: str,
    as_of_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get the latest exchange rate for a currency pair"""
    query = select(ExchangeRate).where(
        and_(
            ExchangeRate.from_currency_code == from_currency.upper(),
            ExchangeRate.to_currency_code == to_currency.upper()
        )
    )

    if as_of_date:
        query = query.where(ExchangeRate.effective_date <= as_of_date)

    query = query.order_by(desc(ExchangeRate.effective_date)).limit(1)

    result = await db.execute(query)
    rate = result.scalar_one_or_none()

    if not rate:
        raise HTTPException(
            status_code=404,
            detail=f"No exchange rate found for {from_currency}/{to_currency}"
        )

    return rate


# ==================== Currency Conversion ====================

@router.post("/convert", response_model=CurrencyConversionResponse)
async def convert_currency(
    conversion: CurrencyConversionRequest,
    db: AsyncSession = Depends(get_db)
):
    """Convert amount from one currency to another"""
    conversion_date = conversion.conversion_date or date.today()

    # If same currency, return as-is
    if conversion.from_currency_code.upper() == conversion.to_currency_code.upper():
        return CurrencyConversionResponse(
            from_currency_code=conversion.from_currency_code.upper(),
            to_currency_code=conversion.to_currency_code.upper(),
            from_amount=conversion.amount,
            to_amount=conversion.amount,
            exchange_rate=1.0,
            conversion_date=conversion_date
        )

    # Try to find direct exchange rate
    direct_rate_result = await db.execute(
        select(ExchangeRate).where(
            and_(
                ExchangeRate.from_currency_code == conversion.from_currency_code.upper(),
                ExchangeRate.to_currency_code == conversion.to_currency_code.upper(),
                ExchangeRate.effective_date <= conversion_date
            )
        ).order_by(desc(ExchangeRate.effective_date)).limit(1)
    )
    direct_rate = direct_rate_result.scalar_one_or_none()

    if direct_rate:
        converted_amount = conversion.amount * direct_rate.rate
        return CurrencyConversionResponse(
            from_currency_code=conversion.from_currency_code.upper(),
            to_currency_code=conversion.to_currency_code.upper(),
            from_amount=conversion.amount,
            to_amount=round(converted_amount, 2),
            exchange_rate=direct_rate.rate,
            conversion_date=conversion_date
        )

    # Try inverse rate
    inverse_rate_result = await db.execute(
        select(ExchangeRate).where(
            and_(
                ExchangeRate.from_currency_code == conversion.to_currency_code.upper(),
                ExchangeRate.to_currency_code == conversion.from_currency_code.upper(),
                ExchangeRate.effective_date <= conversion_date
            )
        ).order_by(desc(ExchangeRate.effective_date)).limit(1)
    )
    inverse_rate = inverse_rate_result.scalar_one_or_none()

    if inverse_rate:
        rate = inverse_rate.inverse_rate
        converted_amount = conversion.amount * rate
        return CurrencyConversionResponse(
            from_currency_code=conversion.from_currency_code.upper(),
            to_currency_code=conversion.to_currency_code.upper(),
            from_amount=conversion.amount,
            to_amount=round(converted_amount, 2),
            exchange_rate=rate,
            conversion_date=conversion_date
        )

    raise HTTPException(
        status_code=404,
        detail=f"No exchange rate found for {conversion.from_currency_code}/{conversion.to_currency_code}"
    )


# ==================== Currency Exchange Transactions ====================

@router.get("/exchange-transactions", response_model=List[CurrencyExchangeTransactionResponse])
async def get_exchange_transactions(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    currency_code: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get currency exchange transactions"""
    query = select(CurrencyExchangeTransaction)

    if from_date:
        query = query.where(CurrencyExchangeTransaction.transaction_date >= from_date)

    if to_date:
        query = query.where(CurrencyExchangeTransaction.transaction_date <= to_date)

    if currency_code:
        query = query.where(
            or_(
                CurrencyExchangeTransaction.from_currency_code == currency_code.upper(),
                CurrencyExchangeTransaction.to_currency_code == currency_code.upper()
            )
        )

    query = query.order_by(desc(CurrencyExchangeTransaction.transaction_date))
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/exchange-transactions", response_model=CurrencyExchangeTransactionResponse)
async def create_exchange_transaction(
    transaction: CurrencyExchangeTransactionCreate,
    created_by: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a currency exchange transaction"""
    # Generate transaction number
    count_result = await db.execute(
        select(func.count(CurrencyExchangeTransaction.id))
    )
    count = count_result.scalar() or 0
    transaction_number = f"FX{date.today().strftime('%Y%m%d')}{str(count + 1).zfill(4)}"

    db_transaction = CurrencyExchangeTransaction(
        **transaction.model_dump(),
        transaction_number=transaction_number,
        created_by=created_by
    )
    db.add(db_transaction)
    await db.commit()
    await db.refresh(db_transaction)

    return db_transaction


# ==================== Base Currency ====================

@router.get("/base-currency", response_model=CurrencyResponse)
async def get_base_currency(db: AsyncSession = Depends(get_db)):
    """Get the base currency"""
    result = await db.execute(
        select(Currency).where(Currency.is_base_currency == True)
    )
    base_currency = result.scalar_one_or_none()

    if not base_currency:
        raise HTTPException(
            status_code=404,
            detail="No base currency configured"
        )

    return base_currency


@router.post("/base-currency/{currency_id}")
async def set_base_currency(currency_id: UUID, db: AsyncSession = Depends(get_db)):
    """Set a currency as the base currency"""
    result = await db.execute(
        select(Currency).where(Currency.id == currency_id)
    )
    new_base = result.scalar_one_or_none()

    if not new_base:
        raise HTTPException(status_code=404, detail="Currency not found")

    # Unset existing base currency
    existing_base_result = await db.execute(
        select(Currency).where(Currency.is_base_currency == True)
    )
    for base_curr in existing_base_result.scalars().all():
        base_curr.is_base_currency = False

    # Set new base currency
    new_base.is_base_currency = True
    new_base.exchange_rate = 1.0
    await db.commit()

    return {"message": f"Currency {new_base.code} set as base currency"}


# ==================== Live Exchange Rate Fetching ====================

@router.get("/live-rates/{base_currency}")
async def fetch_live_rates(
    base_currency: str,
    target_currencies: Optional[str] = Query(None, description="Comma-separated list of target currencies")
):
    """
    Fetch live exchange rates from external API

    Args:
        base_currency: Base currency code (e.g., 'USD')
        target_currencies: Optional comma-separated list (e.g., 'EUR,GBP,JPY')

    Returns:
        Dictionary of live exchange rates
    """
    try:
        fetcher = get_exchange_rate_fetcher()

        target_list = None
        if target_currencies:
            target_list = [c.strip().upper() for c in target_currencies.split(",")]

        rates = await fetcher.fetch_rates(
            base_currency=base_currency.upper(),
            target_currencies=target_list
        )

        return {
            "base_currency": base_currency.upper(),
            "date": date.today().isoformat(),
            "rates": rates,
            "source": "Live API"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch live rates: {str(e)}"
        )


@router.post("/fetch-and-save-rates/{base_currency}")
async def fetch_and_save_live_rates(
    base_currency: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch live exchange rates and save them to the database

    Args:
        base_currency: Base currency code to fetch rates for

    Returns:
        Summary of saved rates
    """
    try:
        # Verify base currency exists
        base_curr_result = await db.execute(
            select(Currency).where(Currency.code == base_currency.upper())
        )
        if not base_curr_result.scalar_one_or_none():
            raise HTTPException(
                status_code=404,
                detail=f"Currency {base_currency} not found in database"
            )

        # Get all active currencies from database
        active_currencies_result = await db.execute(
            select(Currency).where(
                and_(
                    Currency.is_active == True,
                    Currency.code != base_currency.upper()
                )
            )
        )
        active_currencies = active_currencies_result.scalars().all()
        target_codes = [c.code for c in active_currencies]

        if not target_codes:
            return {
                "message": "No target currencies found",
                "saved_rates": 0
            }

        # Fetch live rates
        fetcher = get_exchange_rate_fetcher()
        rates = await fetcher.fetch_rates(
            base_currency=base_currency.upper(),
            target_currencies=target_codes
        )

        # Save rates to database
        saved_count = 0
        today = date.today()

        for currency_code, rate in rates.items():
            inverse_rate = 1 / rate

            db_rate = ExchangeRate(
                from_currency_code=base_currency.upper(),
                to_currency_code=currency_code,
                rate=rate,
                inverse_rate=inverse_rate,
                effective_date=today,
                source="Live API",
                created_by="System"
            )
            db.add(db_rate)
            saved_count += 1

        await db.commit()

        return {
            "message": f"Successfully fetched and saved {saved_count} exchange rates",
            "base_currency": base_currency.upper(),
            "date": today.isoformat(),
            "saved_rates": saved_count,
            "currency_codes": list(rates.keys())
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch and save rates: {str(e)}"
        )


@router.get("/supported-sources")
async def get_supported_rate_sources():
    """Get list of supported exchange rate data sources"""
    fetcher = get_exchange_rate_fetcher()
    return {
        "sources": fetcher.get_supported_sources()
    }
