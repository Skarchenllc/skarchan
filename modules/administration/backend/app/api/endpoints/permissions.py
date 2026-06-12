from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.role import Permission
from app.schemas.role import PermissionCreate, PermissionResponse

router = APIRouter()


@router.get("", response_model=List[PermissionResponse])
async def get_permissions(
    resource: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Get list of all permissions, optionally filtered by resource.
    """
    query = select(Permission)

    if resource:
        query = query.where(Permission.resource == resource)

    query = query.order_by(Permission.resource, Permission.action)
    result = await db.execute(query)
    permissions = result.scalars().all()

    return permissions


@router.get("/{permission_id}", response_model=PermissionResponse)
async def get_permission(
    permission_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific permission by ID.
    """
    result = await db.execute(select(Permission).where(Permission.id == permission_id))
    permission = result.scalar_one_or_none()

    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found",
        )

    return permission


@router.post("", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_permission(
    permission_data: PermissionCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new permission.
    """
    # Check if permission name already exists
    result = await db.execute(
        select(Permission).where(Permission.name == permission_data.name)
    )
    existing_permission = result.scalar_one_or_none()

    if existing_permission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permission name already exists",
        )

    # Create permission
    db_permission = Permission(
        name=permission_data.name,
        description=permission_data.description,
        resource=permission_data.resource,
        action=permission_data.action,
    )

    db.add(db_permission)
    await db.flush()
    await db.refresh(db_permission)

    return db_permission


@router.delete("/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_permission(
    permission_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a permission.
    """
    result = await db.execute(select(Permission).where(Permission.id == permission_id))
    db_permission = result.scalar_one_or_none()

    if not db_permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found",
        )

    await db.delete(db_permission)
    await db.flush()

    return None
