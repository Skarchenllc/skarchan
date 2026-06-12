from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class OrganizationBase(BaseModel):
    """Base organization schema"""
    org_code: str = Field(..., min_length=2, max_length=50, description="Unique organization code")
    org_name: str = Field(..., min_length=1, max_length=255, description="Organization name")
    org_description: Optional[str] = None
    business_type: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    company_size: Optional[str] = Field(None, max_length=50)
    timezone: str = Field(default="UTC", max_length=100)
    currency_code: str = Field(default="USD", max_length=10)
    primary_contact_name: Optional[str] = Field(None, max_length=255)
    primary_contact_email: Optional[EmailStr] = None
    primary_contact_phone: Optional[str] = Field(None, max_length=50)


class OrganizationCreate(OrganizationBase):
    """Create organization schema"""
    subscription_tier: str = Field(default="trial", description="Subscription tier")
    enabled_modules: list[str] = Field(default_factory=list, description="Enabled modules")
    max_users: int = Field(default=10, ge=1, description="Maximum users allowed")
    max_storage_gb: int = Field(default=10, ge=1, description="Maximum storage in GB")


class OrganizationUpdate(BaseModel):
    """Update organization schema"""
    org_name: Optional[str] = Field(None, min_length=1, max_length=255)
    org_description: Optional[str] = None
    business_type: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    company_size: Optional[str] = Field(None, max_length=50)
    timezone: Optional[str] = Field(None, max_length=100)
    currency_code: Optional[str] = Field(None, max_length=10)
    primary_contact_name: Optional[str] = Field(None, max_length=255)
    primary_contact_email: Optional[EmailStr] = None
    primary_contact_phone: Optional[str] = Field(None, max_length=50)
    branding: Optional[dict] = None
    custom_domain: Optional[str] = Field(None, max_length=255)
    feature_flags: Optional[dict] = None
    organization_settings: Optional[dict] = None


class OrganizationResponse(OrganizationBase):
    """Organization response schema"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    subscription_tier: str
    subscription_status: str
    subscription_start_date: Optional[datetime] = None
    subscription_end_date: Optional[datetime] = None
    billing_cycle: str
    enabled_modules: list
    max_users: int
    max_storage_gb: int
    max_api_calls_per_day: int
    current_user_count: int
    current_storage_gb: Decimal
    branding: dict
    custom_domain: Optional[str] = None
    billing_address: dict
    feature_flags: dict
    organization_settings: dict
    is_active: bool
    is_verified: bool
    created_date: datetime
    last_modified_date: Optional[datetime] = None


class OrganizationModulesUpdate(BaseModel):
    """Update organization enabled modules"""
    enabled_modules: list[str] = Field(..., description="List of enabled module codes")


class OrganizationSubscriptionUpdate(BaseModel):
    """Update organization subscription"""
    subscription_tier: str = Field(..., description="Subscription tier (trial, basic, professional, enterprise)")
    billing_cycle: str = Field(default="monthly", description="Billing cycle (monthly, annual)")
    max_users: Optional[int] = Field(None, ge=1, description="Maximum users")
    max_storage_gb: Optional[int] = Field(None, ge=1, description="Maximum storage in GB")
    max_api_calls_per_day: Optional[int] = Field(None, ge=1000, description="Maximum API calls per day")
