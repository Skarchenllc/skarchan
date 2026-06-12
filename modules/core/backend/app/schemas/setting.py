from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any
from datetime import datetime
from uuid import UUID


class SettingBase(BaseModel):
    """Base setting schema"""
    setting_key: str = Field(..., max_length=255, description="Setting key (e.g., email.smtp.host)")
    setting_value: Any = Field(..., description="Setting value (JSON compatible)")
    setting_category: str = Field(..., max_length=100, description="Setting category")
    module_name: Optional[str] = Field(None, max_length=100, description="Module name")
    value_type: str = Field(default="string", description="Value type (string, number, boolean, object, array)")


class SettingCreate(SettingBase):
    """Create setting schema"""
    org_id: Optional[UUID] = Field(None, description="Organization ID (null for system settings)")
    user_id: Optional[UUID] = Field(None, description="User ID (null for org/system settings)")
    setting_name: Optional[str] = Field(None, max_length=255, description="Human-readable name")
    setting_description: Optional[str] = Field(None, description="Setting description")
    setting_group: Optional[str] = Field(None, max_length=100, description="Setting group")
    default_value: Optional[Any] = Field(None, description="Default value")
    is_required: bool = Field(default=False, description="Is required")
    is_encrypted: bool = Field(default=False, description="Is encrypted")
    is_public: bool = Field(default=False, description="Can be exposed to frontend")
    validation_rules: Optional[dict] = Field(None, description="Validation rules (JSON schema)")
    scope: str = Field(default="organization", description="Scope (system, organization, module, user)")


class SettingUpdate(BaseModel):
    """Update setting schema"""
    setting_value: Any = Field(..., description="New setting value")
    setting_name: Optional[str] = Field(None, max_length=255)
    setting_description: Optional[str] = None
    is_active: Optional[bool] = None


class SettingResponse(SettingBase):
    """Setting response schema"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    setting_name: Optional[str] = None
    setting_description: Optional[str] = None
    setting_group: Optional[str] = None
    default_value: Optional[Any] = None
    is_required: bool
    is_encrypted: bool
    is_public: bool
    validation_rules: Optional[dict] = None
    scope: str
    is_active: bool
    created_date: datetime
    last_modified_date: Optional[datetime] = None


class SettingListResponse(BaseModel):
    """Setting list response"""
    total: int
    settings: list[SettingResponse]


class SettingBulkUpdate(BaseModel):
    """Bulk update settings"""
    settings: list[dict] = Field(..., description="List of settings to update")


class SettingsByCategory(BaseModel):
    """Settings grouped by category"""
    category: str
    settings: list[SettingResponse]


class PublicSettingsResponse(BaseModel):
    """Public settings response (safe to expose to frontend)"""
    settings: dict = Field(..., description="Key-value pairs of public settings")


class SettingValidation(BaseModel):
    """Setting validation request"""
    setting_key: str
    setting_value: Any
    validation_rules: Optional[dict] = None
