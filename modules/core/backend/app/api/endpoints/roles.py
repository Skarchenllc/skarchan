from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.db.session import get_db
from app.schemas.role import (
    RoleCreate,
    RoleUpdate,
    RoleResponse,
    PermissionResponse,
    UserRoleAssign,
    UserPermissionsResponse,
)
from app.models.user import User
from app.models.role import Role
from app.api.dependencies import get_current_user, require_permission
from app.services.permission_service import PermissionService


router = APIRouter()


@router.get("/roles", response_model=List[RoleResponse])
async def list_roles(
    include_system_roles: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("roles.read"))
):
    """
    List all roles in the organization.

    - **include_system_roles**: Include system-wide roles

    Requires permission: roles.read
    """
    permission_service = PermissionService(db)
    roles = await permission_service.get_organization_roles(
        org_id=current_user.org_id,
        include_system_roles=include_system_roles
    )

    return roles


@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("roles.create"))
):
    """
    Create a new custom role.

    Requires permission: roles.create
    """
    permission_service = PermissionService(db)

    # Ensure org_id matches current user's org
    role_data.org_id = current_user.org_id

    role = await permission_service.create_role(
        role_data=role_data,
        created_by=current_user.id
    )

    return role


@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("roles.read"))
):
    """
    Get role by ID.

    Requires permission: roles.read
    """
    role = await db.get(Role, role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    # Check access (must be from same org or system role)
    if role.org_id and role.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return role


@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: UUID,
    role_data: RoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("roles.update"))
):
    """
    Update a role.

    Cannot update system roles.

    Requires permission: roles.update
    """
    permission_service = PermissionService(db)
    role = await permission_service.update_role(
        role_id=role_id,
        role_data=role_data,
        updated_by=current_user.id
    )

    return role


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("roles.delete"))
):
    """
    Delete a role (soft delete).

    Cannot delete system roles.

    Requires permission: roles.delete
    """
    permission_service = PermissionService(db)
    await permission_service.delete_role(
        role_id=role_id,
        deleted_by=current_user.id
    )


@router.post("/roles/assign", status_code=status.HTTP_201_CREATED)
async def assign_role_to_user(
    assignment: UserRoleAssign,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("roles.assign"))
):
    """
    Assign a role to a user.

    Requires permission: roles.assign
    """
    permission_service = PermissionService(db)
    user_role = await permission_service.assign_role_to_user(
        user_id=assignment.user_id,
        role_id=assignment.role_id,
        assigned_by=current_user.id,
        valid_from=assignment.valid_from,
        valid_until=assignment.valid_until
    )

    return {"message": "Role assigned successfully", "id": str(user_role.id)}


@router.delete("/roles/assign/{user_id}/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_role_from_user(
    user_id: UUID,
    role_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("roles.assign"))
):
    """
    Remove a role from a user.

    Requires permission: roles.assign
    """
    permission_service = PermissionService(db)
    await permission_service.remove_role_from_user(
        user_id=user_id,
        role_id=role_id,
        removed_by=current_user.id
    )


@router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(
    module_name: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("permissions.read"))
):
    """
    List all available permissions.

    - **module_name**: Filter by module name

    Requires permission: permissions.read
    """
    permission_service = PermissionService(db)

    if module_name:
        permissions = await permission_service.get_permissions_by_module(module_name)
    else:
        permissions = await permission_service.get_all_permissions()

    return permissions


@router.get("/users/{user_id}/permissions", response_model=UserPermissionsResponse)
async def get_user_permissions(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("users.read"))
):
    """
    Get all permissions for a user.

    Requires permission: users.read
    """
    # Get user
    user = await db.get(User, user_id)
    if not user or user.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    permission_service = PermissionService(db)
    roles = await permission_service.get_user_roles(user)
    permissions = await permission_service.get_user_permissions(user)

    return UserPermissionsResponse(
        user_id=user.id,
        roles=roles,
        permissions=permissions,
        effective_permissions=permissions
    )


@router.get("/me/permissions", response_model=UserPermissionsResponse)
async def get_my_permissions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get permissions for current user."""
    permission_service = PermissionService(db)
    roles = await permission_service.get_user_roles(current_user)
    permissions = await permission_service.get_user_permissions(current_user)

    return UserPermissionsResponse(
        user_id=current_user.id,
        roles=roles,
        permissions=permissions,
        effective_permissions=permissions
    )
