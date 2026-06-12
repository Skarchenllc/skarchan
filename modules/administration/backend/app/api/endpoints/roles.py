from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.role import Role, Permission
from app.schemas.role import RoleCreate, RoleUpdate, RoleResponse, RoleWithPermissions

router = APIRouter()


@router.get("", response_model=List[RoleResponse])
async def get_roles(
    db: AsyncSession = Depends(get_db),
):
    """
    Get list of all roles.
    """
    result = await db.execute(select(Role).order_by(Role.created_at.desc()))
    roles = result.scalars().all()

    response_roles = []
    for role in roles:
        role_dict = {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "created_at": role.created_at,
            "updated_at": role.updated_at,
            "permission_ids": [perm.id for perm in role.permissions],
        }
        response_roles.append(RoleResponse(**role_dict))

    return response_roles


@router.get("/{role_id}", response_model=RoleWithPermissions)
async def get_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific role by ID with its permissions.
    """
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    return RoleWithPermissions(
        id=role.id,
        name=role.name,
        description=role.description,
        created_at=role.created_at,
        updated_at=role.updated_at,
        permission_ids=[perm.id for perm in role.permissions],
        permissions=role.permissions,
    )


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new role.
    """
    # Check if role name already exists
    result = await db.execute(select(Role).where(Role.name == role_data.name))
    existing_role = result.scalar_one_or_none()

    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role name already exists",
        )

    # Create role
    db_role = Role(
        name=role_data.name,
        description=role_data.description,
    )

    # Assign permissions
    if role_data.permission_ids:
        result = await db.execute(
            select(Permission).where(Permission.id.in_(role_data.permission_ids))
        )
        permissions = list(result.scalars().all())
        db_role.permissions = permissions

    db.add(db_role)
    await db.flush()
    await db.refresh(db_role)

    return RoleResponse(
        id=db_role.id,
        name=db_role.name,
        description=db_role.description,
        created_at=db_role.created_at,
        updated_at=db_role.updated_at,
        permission_ids=[perm.id for perm in db_role.permissions],
    )


@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    role_data: RoleUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update a role.
    """
    result = await db.execute(select(Role).where(Role.id == role_id))
    db_role = result.scalar_one_or_none()

    if not db_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    # Update fields
    update_data = role_data.model_dump(exclude_unset=True)

    # Handle permission updates
    if "permission_ids" in update_data:
        permission_ids = update_data.pop("permission_ids")
        result = await db.execute(
            select(Permission).where(Permission.id.in_(permission_ids))
        )
        permissions = list(result.scalars().all())
        db_role.permissions = permissions

    # Update other fields
    for field, value in update_data.items():
        setattr(db_role, field, value)

    await db.flush()
    await db.refresh(db_role)

    return RoleResponse(
        id=db_role.id,
        name=db_role.name,
        description=db_role.description,
        created_at=db_role.created_at,
        updated_at=db_role.updated_at,
        permission_ids=[perm.id for perm in db_role.permissions],
    )


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a role.
    """
    result = await db.execute(select(Role).where(Role.id == role_id))
    db_role = result.scalar_one_or_none()

    if not db_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    await db.delete(db_role)
    await db.flush()

    return None
