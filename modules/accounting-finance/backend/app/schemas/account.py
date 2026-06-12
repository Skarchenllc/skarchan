from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.account import AccountType


class AccountBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    type: AccountType
    category: Optional[str] = Field(None, max_length=100)
    balance: float = Field(default=0.0)
    currency: str = Field(default="USD", max_length=3)
    is_active: bool = Field(default=True)
    description: Optional[str] = Field(None, max_length=500)


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[AccountType] = None
    category: Optional[str] = Field(None, max_length=100)
    balance: Optional[float] = None
    currency: Optional[str] = Field(None, max_length=3)
    is_active: Optional[bool] = None
    description: Optional[str] = Field(None, max_length=500)


class AccountResponse(AccountBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AccountSummary(BaseModel):
    id: UUID
    code: str
    name: str
    type: AccountType
    balance: float
    currency: str

    class Config:
        from_attributes = True
