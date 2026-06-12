from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID


class AuditLogBase(BaseModel):
    """Base audit log schema"""
    event_type: str = Field(..., max_length=100, description="Event type (e.g., user.login, crm.account.create)")
    event_category: str = Field(..., max_length=50, description="Event category (auth, data, settings, etc.)")
    event_description: Optional[str] = Field(None, description="Event description")


class AuditLogCreate(AuditLogBase):
    """Create audit log schema"""
    org_id: UUID = Field(..., description="Organization ID")
    user_id: Optional[UUID] = Field(None, description="User who performed the action")
    module_name: Optional[str] = Field(None, max_length=100, description="Module name")
    resource_type: Optional[str] = Field(None, max_length=100, description="Resource type")
    resource_id: Optional[UUID] = Field(None, description="Resource ID")
    resource_name: Optional[str] = Field(None, max_length=255, description="Resource name")
    action: Optional[str] = Field(None, max_length=50, description="Action performed")
    old_values: Optional[dict] = Field(None, description="Previous values")
    new_values: Optional[dict] = Field(None, description="New values")
    changes: Optional[dict] = Field(None, description="Specific field changes")
    ip_address: Optional[str] = Field(None, description="IP address")
    user_agent: Optional[str] = Field(None, description="User agent")
    request_method: Optional[str] = Field(None, max_length=10, description="HTTP method")
    request_path: Optional[str] = Field(None, max_length=500, description="Request path")
    request_params: Optional[dict] = Field(None, description="Request parameters")
    status: str = Field(default="success", description="Operation status")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    session_id: Optional[UUID] = Field(None, description="Session ID")
    severity: str = Field(default="info", description="Event severity")
    is_security_event: bool = Field(default=False, description="Is security event")
    compliance_category: Optional[str] = Field(None, max_length=50, description="Compliance category")


class AuditLogResponse(AuditLogBase):
    """Audit log response schema"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    user_id: Optional[UUID] = None
    module_name: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[UUID] = None
    resource_name: Optional[str] = None
    action: Optional[str] = None
    old_values: Optional[dict] = None
    new_values: Optional[dict] = None
    changes: Optional[dict] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_method: Optional[str] = None
    request_path: Optional[str] = None
    request_params: Optional[dict] = None
    status: str
    error_message: Optional[str] = None
    session_id: Optional[UUID] = None
    severity: str
    is_security_event: bool
    compliance_category: Optional[str] = None
    created_date: datetime


class AuditLogListResponse(BaseModel):
    """Audit log list response with pagination"""
    total: int
    page: int
    page_size: int
    logs: list[AuditLogResponse]


class AuditLogFilter(BaseModel):
    """Audit log filter schema"""
    user_id: Optional[UUID] = None
    module_name: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[UUID] = None
    event_category: Optional[str] = None
    event_type: Optional[str] = None
    action: Optional[str] = None
    status: Optional[str] = None
    severity: Optional[str] = None
    is_security_event: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=100)


class AuditLogExport(BaseModel):
    """Audit log export request"""
    filter: AuditLogFilter
    export_format: str = Field(default="csv", description="Export format (csv, json, xlsx)")
    include_sensitive_data: bool = Field(default=False, description="Include sensitive data")
