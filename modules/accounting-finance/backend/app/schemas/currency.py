from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime, date
from uuid import UUID


# Currency Schemas
class CurrencyBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=3, description="3-letter currency code (ISO 4217)")
    name: str = Field(..., min_length=1, max_length=100)
    symbol: Optional[str] = Field(None, max_length=10)
    exchange_rate: float = Field(1.0, gt=0, description="Exchange rate relative to base currency")
    is_base_currency: bool = False
    decimal_places: int = Field(2, ge=0, le=4)
    is_active: bool = True

    @validator('code')
    def code_uppercase(cls, v):
        return v.upper()


class CurrencyCreate(CurrencyBase):
    pass


class CurrencyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    symbol: Optional[str] = Field(None, max_length=10)
    exchange_rate: Optional[float] = Field(None, gt=0)
    is_base_currency: Optional[bool] = None
    decimal_places: Optional[int] = Field(None, ge=0, le=4)
    is_active: Optional[bool] = None


class CurrencyResponse(CurrencyBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Exchange Rate Schemas
class ExchangeRateBase(BaseModel):
    from_currency_code: str = Field(..., min_length=3, max_length=3)
    to_currency_code: str = Field(..., min_length=3, max_length=3)
    rate: float = Field(..., gt=0)
    effective_date: date
    source: Optional[str] = Field(None, max_length=100)

    @validator('from_currency_code', 'to_currency_code')
    def code_uppercase(cls, v):
        return v.upper()

    @validator('to_currency_code')
    def currencies_different(cls, v, values):
        if 'from_currency_code' in values and v == values['from_currency_code']:
            raise ValueError('from_currency_code and to_currency_code must be different')
        return v


class ExchangeRateCreate(ExchangeRateBase):
    pass


class ExchangeRateUpdate(BaseModel):
    rate: Optional[float] = Field(None, gt=0)
    effective_date: Optional[date] = None
    source: Optional[str] = Field(None, max_length=100)


class ExchangeRateResponse(ExchangeRateBase):
    id: UUID
    inverse_rate: float
    created_at: datetime
    created_by: Optional[str]

    class Config:
        from_attributes = True


# Currency Exchange Transaction Schemas
class CurrencyExchangeTransactionBase(BaseModel):
    transaction_date: date
    from_currency_code: str = Field(..., min_length=3, max_length=3)
    to_currency_code: str = Field(..., min_length=3, max_length=3)
    from_amount: float = Field(..., gt=0)
    to_amount: float = Field(..., gt=0)
    exchange_rate: float = Field(..., gt=0)
    from_account_id: Optional[UUID] = None
    to_account_id: Optional[UUID] = None
    realized_gain_loss: float = 0.0
    gain_loss_account_id: Optional[UUID] = None
    reference: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = Field(None, max_length=500)

    @validator('from_currency_code', 'to_currency_code')
    def code_uppercase(cls, v):
        return v.upper()


class CurrencyExchangeTransactionCreate(CurrencyExchangeTransactionBase):
    pass


class CurrencyExchangeTransactionUpdate(BaseModel):
    transaction_date: Optional[date] = None
    from_amount: Optional[float] = Field(None, gt=0)
    to_amount: Optional[float] = Field(None, gt=0)
    exchange_rate: Optional[float] = Field(None, gt=0)
    from_account_id: Optional[UUID] = None
    to_account_id: Optional[UUID] = None
    realized_gain_loss: Optional[float] = None
    gain_loss_account_id: Optional[UUID] = None
    reference: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = Field(None, max_length=500)


class CurrencyExchangeTransactionResponse(CurrencyExchangeTransactionBase):
    id: UUID
    transaction_number: str
    created_by: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Unrealized Gain/Loss Schemas
class UnrealizedGainLossBase(BaseModel):
    account_id: UUID
    currency_code: str = Field(..., min_length=3, max_length=3)
    calculation_date: date
    foreign_currency_balance: float
    original_exchange_rate: float = Field(..., gt=0)
    current_exchange_rate: float = Field(..., gt=0)
    base_currency_balance_original: float
    base_currency_balance_current: float
    unrealized_gain_loss: float

    @validator('currency_code')
    def code_uppercase(cls, v):
        return v.upper()


class UnrealizedGainLossCreate(UnrealizedGainLossBase):
    pass


class UnrealizedGainLossResponse(UnrealizedGainLossBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Currency Conversion Schemas
class CurrencyConversionRequest(BaseModel):
    from_currency_code: str = Field(..., min_length=3, max_length=3)
    to_currency_code: str = Field(..., min_length=3, max_length=3)
    amount: float = Field(..., gt=0)
    conversion_date: Optional[date] = None

    @validator('from_currency_code', 'to_currency_code')
    def code_uppercase(cls, v):
        return v.upper()


class CurrencyConversionResponse(BaseModel):
    from_currency_code: str
    to_currency_code: str
    from_amount: float
    to_amount: float
    exchange_rate: float
    conversion_date: date


# Bulk Exchange Rate Update
class BulkExchangeRateUpdate(BaseModel):
    base_currency_code: str = Field(..., min_length=3, max_length=3)
    rates: dict[str, float] = Field(..., description="Dictionary of currency_code: rate")
    effective_date: date
    source: str = Field(..., max_length=100)

    @validator('base_currency_code')
    def code_uppercase(cls, v):
        return v.upper()

    @validator('rates')
    def validate_rates(cls, v):
        for code, rate in v.items():
            if len(code) != 3:
                raise ValueError(f'Currency code {code} must be 3 characters')
            if rate <= 0:
                raise ValueError(f'Exchange rate for {code} must be greater than 0')
        return {code.upper(): rate for code, rate in v.items()}
