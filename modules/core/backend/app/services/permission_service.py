from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from fastapi import HTTPException, status
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from app.models.user import User
from app.models.role import Role, Permission, UserRole
from app.models.organization import Organization
from app.schemas.role import RoleCreate, RoleUpdate, UserRoleAssign


class PermissionService:
    """Service for role-based access control (RBAC) and permission management"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_permission(
        self,
        user: User,
        permission_code: str
    ) -> bool:
        """
        Check if user has a specific permission.

        Args:
            user: User object
            permission_code: Permission code (e.g., 'crm.accounts.create')

        Returns:
            bool: True if user has permission, False otherwise
        """
        # Get all active user roles
        result = await self.db.execute(
            select(UserRole)
            .where(
                and_(
                    UserRole.user_id == user.id,
                    UserRole.is_active == True,
                    UserRole.deleted_flag == False
                )
            )
        )
        user_roles = result.scalars().all()

        # Check permissions in each role
        for user_role in user_roles:
            # Check if role assignment is valid (time-bound)
            if not user_role.is_valid():
                continue

            # Get role
            role = await self.db.get(Role, user_role.role_id)
            if not role or not role.is_active:
                continue

            # Check if role has permission
            if role.has_permission(permission_code):
                return True

        return False

    async def get_user_permissions(self, user: User) -> List[str]:
        """
        Get all permissions for a user.

        Args:
            user: User object

        Returns:
            List[str]: List of permission codes
        """
        permissions = set()

        # Get all active user roles
        result = await self.db.execute(
            select(UserRole)
            .where(
                and_(
                    UserRole.user_id == user.id,
                    UserRole.is_active == True,
                    UserRole.deleted_flag == False
                )
            )
        )
        user_roles = result.scalars().all()

        # Collect permissions from all roles
        for user_role in user_roles:
            if not user_role.is_valid():
                continue

            role = await self.db.get(Role, user_role.role_id)
            if role and role.is_active and role.permissions:
                permissions.update(role.permissions)

        return list(permissions)

    async def get_user_roles(self, user: User) -> List[Role]:
        """
        Get all roles for a user.

        Args:
            user: User object

        Returns:
            List[Role]: List of roles
        """
        result = await self.db.execute(
            select(Role)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(
                and_(
                    UserRole.user_id == user.id,
                    UserRole.is_active == True,
                    UserRole.deleted_flag == False,
                    Role.is_active == True
                )
            )
        )
        roles = result.scalars().all()
        return list(roles)

    async def assign_role_to_user(
        self,
        user_id: UUID,
        role_id: UUID,
        assigned_by: UUID,
        valid_from: Optional[datetime] = None,
        valid_until: Optional[datetime] = None
    ) -> UserRole:
        """
        Assign a role to a user.

        Args:
            user_id: User ID
            role_id: Role ID
            assigned_by: User ID who is assigning the role
            valid_from: Role valid from date
            valid_until: Role valid until date

        Returns:
            UserRole: Created user role assignment

        Raises:
            HTTPException: If user or role not found
        """
        # Check if user exists
        user = await self.db.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Check if role exists
        role = await self.db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )

        # Check if role belongs to same organization (or is system role)
        if role.org_id and role.org_id != user.org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot assign role from different organization"
            )

        # Check if user already has this role
        existing = await self.db.execute(
            select(UserRole)
            .where(
                and_(
                    UserRole.user_id == user_id,
                    UserRole.role_id == role_id,
                    UserRole.is_active == True,
                    UserRole.deleted_flag == False
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has this role"
            )

        # Create user role assignment
        user_role = UserRole(
            user_id=user_id,
            role_id=role_id,
            assigned_by=assigned_by,
            valid_from=valid_from,
            valid_until=valid_until,
            is_active=True,
            created_by=assigned_by,
            last_modified_by=assigned_by,
        )
        self.db.add(user_role)
        await self.db.commit()
        await self.db.refresh(user_role)

        return user_role

    async def remove_role_from_user(
        self,
        user_id: UUID,
        role_id: UUID,
        removed_by: UUID
    ):
        """
        Remove a role from a user (soft delete).

        Args:
            user_id: User ID
            role_id: Role ID
            removed_by: User ID who is removing the role

        Raises:
            HTTPException: If role assignment not found
        """
        result = await self.db.execute(
            select(UserRole)
            .where(
                and_(
                    UserRole.user_id == user_id,
                    UserRole.role_id == role_id,
                    UserRole.is_active == True,
                    UserRole.deleted_flag == False
                )
            )
        )
        user_role = result.scalar_one_or_none()

        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role assignment not found"
            )

        # Soft delete
        user_role.is_active = False
        user_role.deleted_flag = True
        user_role.deleted_date = datetime.utcnow()
        user_role.deleted_by = removed_by

        await self.db.commit()

    async def create_role(
        self,
        role_data: RoleCreate,
        created_by: UUID
    ) -> Role:
        """
        Create a new role.

        Args:
            role_data: Role creation data
            created_by: User ID who is creating the role

        Returns:
            Role: Created role

        Raises:
            HTTPException: If role code already exists
        """
        # Check if role code already exists
        result = await self.db.execute(
            select(Role)
            .where(
                and_(
                    Role.role_code == role_data.role_code,
                    Role.org_id == role_data.org_id if role_data.org_id else Role.org_id.is_(None),
                    Role.deleted_flag == False
                )
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role code already exists"
            )

        role = Role(
            org_id=role_data.org_id,
            role_code=role_data.role_code,
            role_name=role_data.role_name,
            role_description=role_data.role_description,
            permissions=role_data.permissions,
            scope=role_data.scope,
            module_name=role_data.module_name,
            parent_role_id=role_data.parent_role_id,
            hierarchy_level=role_data.hierarchy_level,
            is_system_role=False,
            is_custom_role=True,
            is_active=True,
            created_by=created_by,
            last_modified_by=created_by,
        )
        self.db.add(role)
        await self.db.commit()
        await self.db.refresh(role)

        return role

    async def update_role(
        self,
        role_id: UUID,
        role_data: RoleUpdate,
        updated_by: UUID
    ) -> Role:
        """
        Update a role.

        Args:
            role_id: Role ID
            role_data: Role update data
            updated_by: User ID who is updating the role

        Returns:
            Role: Updated role

        Raises:
            HTTPException: If role not found or is system role
        """
        role = await self.db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )

        # Cannot update system roles
        if role.is_system_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update system role"
            )

        # Update fields
        if role_data.role_name is not None:
            role.role_name = role_data.role_name
        if role_data.role_description is not None:
            role.role_description = role_data.role_description
        if role_data.permissions is not None:
            role.permissions = role_data.permissions
        if role_data.is_active is not None:
            role.is_active = role_data.is_active

        role.last_modified_by = updated_by
        role.last_modified_date = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(role)

        return role

    async def delete_role(
        self,
        role_id: UUID,
        deleted_by: UUID
    ):
        """
        Delete a role (soft delete).

        Args:
            role_id: Role ID
            deleted_by: User ID who is deleting the role

        Raises:
            HTTPException: If role not found or is system role
        """
        role = await self.db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )

        # Cannot delete system roles
        if role.is_system_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete system role"
            )

        # Soft delete
        role.is_active = False
        role.deleted_flag = True
        role.deleted_date = datetime.utcnow()
        role.deleted_by = deleted_by

        await self.db.commit()

    async def get_all_permissions(self) -> List[Permission]:
        """Get all available permissions"""
        result = await self.db.execute(
            select(Permission)
            .where(Permission.is_active == True)
            .order_by(Permission.module_name, Permission.permission_code)
        )
        return list(result.scalars().all())

    async def get_permissions_by_module(self, module_name: str) -> List[Permission]:
        """Get all permissions for a specific module"""
        result = await self.db.execute(
            select(Permission)
            .where(
                and_(
                    Permission.module_name == module_name,
                    Permission.is_active == True
                )
            )
            .order_by(Permission.permission_code)
        )
        return list(result.scalars().all())

    async def get_organization_roles(
        self,
        org_id: UUID,
        include_system_roles: bool = True
    ) -> List[Role]:
        """
        Get all roles for an organization.

        Args:
            org_id: Organization ID
            include_system_roles: Include system roles in results

        Returns:
            List[Role]: List of roles
        """
        conditions = [Role.is_active == True, Role.deleted_flag == False]

        if include_system_roles:
            # Include both org roles and system roles
            conditions.append(
                or_(
                    Role.org_id == org_id,
                    Role.org_id.is_(None)  # System roles
                )
            )
        else:
            # Only org-specific roles
            conditions.append(Role.org_id == org_id)

        result = await self.db.execute(
            select(Role)
            .where(and_(*conditions))
            .order_by(Role.hierarchy_level, Role.role_name)
        )
        return list(result.scalars().all())
