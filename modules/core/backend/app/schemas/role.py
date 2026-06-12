from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID


class RoleBase(BaseModel):
    """Base role schema"""
    role_code: str = Field(..., min_length=2, max_length=100, description="Unique role code")
    role_name: str = Field(..., min_length=1, max_length=255, description="Role name")
    role_description: Optional[str] = None
    permissions: list[str] = Field(default_factory=list, description="List of permission codes")
    scope: str = Field(default="organization", description="Role scope (system, organization, module)")
    module_name: Optional[str] = Field(None, max_length=100, description="Module name for module-scoped roles")


class RoleCreate(RoleBase):
    """Create role schema"""
    org_id: Optional[UUID] = Field(None, description="Organization ID (null for system roles)")
    parent_role_id: Optional[UUID] = Field(None, description="Parent role ID for hierarchy")
    hierarchy_level: int = Field(default=0, ge=0, le=999, description="Hierarchy level")


class RoleUpdate(BaseModel):
    """Update role schema"""
    role_name: Optional[str] = Field(None, min_length=1, max_length=255)
    role_description: Optional[str] = None
    permissions: Optional[list[str]] = None
    is_active: Optional[bool] = None


class RoleResponse(RoleBase):
    """Role response schema"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: Optional[UUID] = None
    is_system_role: Optional[bool] = False
    is_custom_role: Optional[bool] = True
    parent_role_id: Optional[UUID] = None
    hierarchy_level: Optional[int] = 0
    is_active: Optional[bool] = True
    created_date: datetime
    last_modified_date: Optional[datetime] = None


class PermissionBase(BaseModel):
    """Base permission schema"""
    permission_code: str = Field(..., max_length=255, description="Permission code (e.g., crm.accounts.create)")
    permission_name: str = Field(..., max_length=255, description="Permission name")
    permission_description: Optional[str] = None
    module_name: str = Field(..., max_length=100, description="Module name")
    resource_type: Optional[str] = Field(None, max_length=100, description="Resource type")
    action: Optional[str] = Field(None, max_length=50, description="Action (create, read, update, delete)")
    permission_category: Optional[str] = Field(None, max_length=100, description="Permission category")


class PermissionResponse(PermissionBase):
    """Permission response schema"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_system_permission: bool
    is_active: bool
    created_date: datetime


class UserRoleAssign(BaseModel):
    """Assign role to user"""
    user_id: UUID = Field(..., description="User ID")
    role_id: UUID = Field(..., description="Role ID")
    valid_from: Optional[datetime] = Field(None, description="Role valid from date")
    valid_until: Optional[datetime] = Field(None, description="Role valid until date")


class UserRoleResponse(BaseModel):
    """User role assignment response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    role_id: UUID
    assigned_by: Optional[UUID] = None
    assigned_date: datetime
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: bool
    role: RoleResponse


class UserPermissionsResponse(BaseModel):
    """User permissions response"""
    user_id: UUID
    roles: list[RoleResponse]
    permissions: list[str]
    effective_permissions: list[str]  # Computed from all roles
