from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class PermissionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    resource: str = Field(..., min_length=1, max_length=50)
    action: str = Field(..., min_length=1, max_length=50)


class PermissionCreate(PermissionBase):
    pass


class PermissionResponse(PermissionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class RoleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class RoleCreate(RoleBase):
    permission_ids: List[int] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None


class RoleResponse(RoleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    permission_ids: List[int] = []
    created_at: datetime
    updated_at: Optional[datetime] = None


class RoleWithPermissions(RoleResponse):
    permissions: List[PermissionResponse] = []


class RoleListResponse(BaseModel):
    roles: List[RoleResponse]
    total: int
