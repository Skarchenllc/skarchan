from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from uuid import UUID

from app.models.tax import TaxType, TaxReportingPeriod


# Tax Rate Schemas
class TaxRateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: TaxType
    rate: float = Field(..., ge=0, le=100)
    account: Optional[str] = Field(None, max_length=255)
    authority: Optional[str] = Field(None, max_length=255)
    active: bool = Field(default=True)
    description: Optional[str] = Field(None, max_length=500)


class TaxRateCreate(TaxRateBase):
    pass


class TaxRateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[TaxType] = None
    rate: Optional[float] = Field(None, ge=0, le=100)
    account: Optional[str] = Field(None, max_length=255)
    authority: Optional[str] = Field(None, max_length=255)
    active: Optional[bool] = None
    description: Optional[str] = Field(None, max_length=500)


class TaxRateResponse(TaxRateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Tax Settings Schemas
class TaxSettingsBase(BaseModel):
    tax_reg_number: Optional[str] = Field(None, max_length=100)
    vat_number: Optional[str] = Field(None, max_length=100)
    default_sales_tax_rate: float = Field(default=0.0, ge=0, le=100)
    tax_reporting_period: TaxReportingPeriod = Field(default=TaxReportingPeriod.MONTHLY)


class TaxSettingsCreate(TaxSettingsBase):
    pass


class TaxSettingsUpdate(BaseModel):
    tax_reg_number: Optional[str] = Field(None, max_length=100)
    vat_number: Optional[str] = Field(None, max_length=100)
    default_sales_tax_rate: Optional[float] = Field(None, ge=0, le=100)
    tax_reporting_period: Optional[TaxReportingPeriod] = None


class TaxSettingsResponse(TaxSettingsBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Tax Payment Schemas
class TaxPaymentBase(BaseModel):
    payment_date: date
    tax_type: TaxType
    period: str = Field(..., max_length=100)
    amount_paid: float = Field(..., gt=0)
    payment_method: Optional[str] = Field(None, max_length=100)
    reference: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class TaxPaymentCreate(TaxPaymentBase):
    pass


class TaxPaymentUpdate(BaseModel):
    payment_date: Optional[date] = None
    tax_type: Optional[TaxType] = None
    period: Optional[str] = Field(None, max_length=100)
    amount_paid: Optional[float] = Field(None, gt=0)
    payment_method: Optional[str] = Field(None, max_length=100)
    reference: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class TaxPaymentResponse(TaxPaymentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
