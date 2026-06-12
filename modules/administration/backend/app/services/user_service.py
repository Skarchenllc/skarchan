from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from fastapi import HTTPException, status

from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password, validate_password_strength


class UserService:
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        """Get user by ID."""
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Get user by email."""
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
        """Get user by username."""
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_users(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> List[User]:
        """Get list of users with optional filters."""
        query = select(User)

        # Apply filters
        filters = []
        if search:
            filters.append(
                or_(
                    User.email.ilike(f"%{search}%"),
                    User.username.ilike(f"%{search}%"),
                    User.full_name.ilike(f"%{search}%"),
                )
            )
        if is_active is not None:
            filters.append(User.is_active == is_active)

        if filters:
            query = query.where(and_(*filters))

        query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def count_users(
        db: AsyncSession,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> int:
        """Count users with optional filters."""
        from sqlalchemy import func

        query = select(func.count(User.id))

        filters = []
        if search:
            filters.append(
                or_(
                    User.email.ilike(f"%{search}%"),
                    User.username.ilike(f"%{search}%"),
                    User.full_name.ilike(f"%{search}%"),
                )
            )
        if is_active is not None:
            filters.append(User.is_active == is_active)

        if filters:
            query = query.where(and_(*filters))

        result = await db.execute(query)
        return result.scalar_one()

    @staticmethod
    async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
        """Create a new user."""
        # Check if email already exists
        existing_user = await UserService.get_user_by_email(db, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Check if username already exists
        existing_user = await UserService.get_user_by_username(db, user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken",
            )

        # Validate password strength
        is_valid, error_msg = validate_password_strength(user_data.password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg,
            )

        # Create user
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            hashed_password=get_password_hash(user_data.password),
            is_active=user_data.is_active,
            is_superuser=user_data.is_superuser,
        )

        # Assign roles
        if user_data.role_ids:
            result = await db.execute(select(Role).where(Role.id.in_(user_data.role_ids)))
            roles = list(result.scalars().all())
            db_user.roles = roles

        db.add(db_user)
        await db.flush()
        await db.refresh(db_user)

        return db_user

    @staticmethod
    async def update_user(
        db: AsyncSession, user_id: int, user_data: UserUpdate
    ) -> User:
        """Update a user."""
        db_user = await UserService.get_user_by_id(db, user_id)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Update fields
        update_data = user_data.model_dump(exclude_unset=True)

        # Handle password update
        if "password" in update_data:
            is_valid, error_msg = validate_password_strength(update_data["password"])
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_msg,
                )
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

        # Handle role updates
        if "role_ids" in update_data:
            role_ids = update_data.pop("role_ids")
            result = await db.execute(select(Role).where(Role.id.in_(role_ids)))
            roles = list(result.scalars().all())
            db_user.roles = roles

        # Update other fields
        for field, value in update_data.items():
            setattr(db_user, field, value)

        await db.flush()
        await db.refresh(db_user)

        return db_user

    @staticmethod
    async def delete_user(db: AsyncSession, user_id: int) -> bool:
        """Delete a user."""
        db_user = await UserService.get_user_by_id(db, user_id)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        await db.delete(db_user)
        await db.flush()

        return True

    @staticmethod
    async def authenticate_user(
        db: AsyncSession, username: str, password: str
    ) -> Optional[User]:
        """Authenticate a user."""
        user = await UserService.get_user_by_username(db, username)
        if not user:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        if not user.is_active:
            return None

        return user
