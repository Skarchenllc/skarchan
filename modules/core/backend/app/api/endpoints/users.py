from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID

from app.db.session import get_db
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.models.user import User
from app.models.role import UserRole
from app.api.dependencies import get_current_user, require_permission
from app.core.security import get_password_hash


def _user_to_response(user: User) -> dict:
    """Serialize a User (with eager-loaded user_roles + role) to a JSON-ready dict including roles."""
    base = UserResponse.model_validate(user, from_attributes=True).model_dump(mode="json")
    roles = []
    for ur in (user.user_roles or []):
        if ur.deleted_flag or not ur.is_active:
            continue
        r = ur.role
        if r is None or r.deleted_flag or not r.is_active:
            continue
        roles.append({
            "id": str(r.id),
            "role_code": r.role_code,
            "role_name": r.role_name,
        })
    base["roles"] = roles
    return base


router = APIRouter()


@router.get("", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("users.read"))
):
    """
    List all users in the organization.

    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 50, max: 100)
    - **search**: Search by name, email, or username
    - **is_active**: Filter by active status

    Requires permission: users.read
    """
    # Build query
    conditions = [User.org_id == current_user.org_id, User.deleted_flag == False]

    if search:
        search_filter = f"%{search}%"
        conditions.append(
            (User.first_name.ilike(search_filter)) |
            (User.last_name.ilike(search_filter)) |
            (User.email.ilike(search_filter)) |
            (User.username.ilike(search_filter))
        )

    if is_active is not None:
        conditions.append(User.is_active == is_active)

    query = (
        select(User)
        .where(and_(*conditions))
        .options(selectinload(User.user_roles).selectinload(UserRole.role))
    )

    # Get total count
    count_query = select(func.count(User.id)).where(and_(*conditions))
    total = await db.scalar(count_query)

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(User.created_date.desc())

    result = await db.execute(query)
    users = result.scalars().all()

    return {
        "total": total or 0,
        "page": page,
        "page_size": page_size,
        "users": [_user_to_response(u) for u in users],
    }


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("users.create"))
):
    """
    Create a new user in the organization.

    Requires permission: users.create
    """
    # Check if email already exists
    existing = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username already exists
    existing = await db.execute(
        select(User).where(User.username == user_data.username)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create user
    user = User(
        org_id=user_data.org_id,
        email=user_data.email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        full_name=f"{user_data.first_name} {user_data.last_name}" if user_data.first_name and user_data.last_name else None,
        phone=user_data.phone,
        phone_mobile=user_data.phone_mobile,
        job_title=user_data.job_title,
        department=user_data.department,
        timezone=user_data.timezone,
        language=user_data.language,
        is_active=True,
        created_by=current_user.id,
        last_modified_by=current_user.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("users.read"))
):
    """
    Get user by ID.

    Requires permission: users.read
    """
    user = await db.get(User, user_id)
    if not user or user.org_id != current_user.org_id or user.deleted_flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("users.update"))
):
    """
    Update user information.

    Requires permission: users.update
    """
    user = await db.get(User, user_id)
    if not user or user.org_id != current_user.org_id or user.deleted_flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update fields
    if user_data.email is not None:
        # Check if email already taken by another user
        existing = await db.execute(
            select(User).where(and_(User.email == user_data.email, User.id != user_id))
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        user.email = user_data.email

    if user_data.first_name is not None:
        user.first_name = user_data.first_name
    if user_data.last_name is not None:
        user.last_name = user_data.last_name
    if user_data.first_name is not None or user_data.last_name is not None:
        user.full_name = f"{user.first_name} {user.last_name}"
    if user_data.phone is not None:
        user.phone = user_data.phone
    if user_data.phone_mobile is not None:
        user.phone_mobile = user_data.phone_mobile
    if user_data.job_title is not None:
        user.job_title = user_data.job_title
    if user_data.department is not None:
        user.department = user_data.department
    if user_data.profile_photo_url is not None:
        user.profile_photo_url = user_data.profile_photo_url
    if user_data.bio is not None:
        user.bio = user_data.bio
    if user_data.timezone is not None:
        user.timezone = user_data.timezone
    if user_data.language is not None:
        user.language = user_data.language
    if user_data.date_format is not None:
        user.date_format = user_data.date_format
    if user_data.time_format is not None:
        user.time_format = user_data.time_format
    if user_data.preferences is not None:
        user.preferences = user_data.preferences

    user.last_modified_by = current_user.id

    await db.commit()
    await db.refresh(user)

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("users.delete"))
):
    """
    Delete user (soft delete).

    Requires permission: users.delete
    """
    user = await db.get(User, user_id)
    if not user or user.org_id != current_user.org_id or user.deleted_flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent self-deletion
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    # Soft delete
    user.is_active = False
    user.deleted_flag = True
    user.deleted_by = current_user.id

    await db.commit()
