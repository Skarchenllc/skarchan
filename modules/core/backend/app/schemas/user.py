from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    phone_mobile: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    timezone: str = Field(default="UTC", max_length=100)
    language: str = Field(default="en", max_length=10)


class UserCreate(UserBase):
    """Create user schema"""
    password: str = Field(..., min_length=8)
    org_id: UUID = Field(..., description="Organization ID")


class UserUpdate(BaseModel):
    """Update user schema"""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    phone_mobile: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    profile_photo_url: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = None
    timezone: Optional[str] = Field(None, max_length=100)
    language: Optional[str] = Field(None, max_length=10)
    date_format: Optional[str] = Field(None, max_length=50)
    time_format: Optional[str] = Field(None, max_length=50)
    preferences: Optional[dict] = None


class UserResponse(UserBase):
    """User response schema"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    full_name: Optional[str] = None
    profile_photo_url: Optional[str] = None
    bio: Optional[str] = None
    employee_id: Optional[str] = None
    two_factor_enabled: bool = False
    email_verified: bool = False
    is_active: bool = True
    is_locked: bool = False
    last_login_date: Optional[datetime] = None
    date_format: str = "YYYY-MM-DD"
    time_format: str = "24h"
    created_date: datetime
    last_modified_date: Optional[datetime] = None


class UserListResponse(BaseModel):
    """User list response with pagination"""
    total: int
    page: int
    page_size: int
    users: list[dict]  # each user dict includes a 'roles' array of {id, role_code, role_name}


class UserProfileUpdate(BaseModel):
    """Update user profile (for current user)"""
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    phone_mobile: Optional[str] = Field(None, max_length=50)
    profile_photo_url: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = None
    timezone: Optional[str] = Field(None, max_length=100)
    language: Optional[str] = Field(None, max_length=10)
    preferences: Optional[dict] = None


class ChangePassword(BaseModel):
    """Change password schema"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")
    confirm_password: str = Field(..., description="Confirm new password")
