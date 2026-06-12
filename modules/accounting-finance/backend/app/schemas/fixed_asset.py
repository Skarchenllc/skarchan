from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from uuid import UUID

from app.models.fixed_asset import AssetCategory, DepreciationMethod


class FixedAssetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: AssetCategory
    purchase_date: date
    cost: float = Field(..., gt=0)
    useful_life: int = Field(..., gt=0)
    depreciation_method: DepreciationMethod
    salvage_value: float = Field(default=0.0, ge=0)
    serial_number: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class FixedAssetCreate(FixedAssetBase):
    pass


class FixedAssetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[AssetCategory] = None
    purchase_date: Optional[date] = None
    cost: Optional[float] = Field(None, gt=0)
    useful_life: Optional[int] = Field(None, gt=0)
    depreciation_method: Optional[DepreciationMethod] = None
    salvage_value: Optional[float] = Field(None, ge=0)
    serial_number: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    accumulated_depreciation: Optional[float] = Field(None, ge=0)


class FixedAssetResponse(FixedAssetBase):
    id: UUID
    accumulated_depreciation: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @property
    def book_value(self):
        return self.cost - self.accumulated_depreciation
