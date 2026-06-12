from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from typing import Optional, Tuple
from uuid import UUID
import pyotp

from app.models.user import User
from app.models.organization import Organization
from app.models.session import Session
from app.models.role import Role, UserRole
from app.schemas.auth import UserLogin, UserRegister, Token, TokenData
from app.core.security import (
    verify_password,
    get_password_hash,
    validate_password_strength,
    create_access_token,
    create_refresh_token,
    decode_token,
    create_session_token,
    generate_email_verification_token,
    generate_password_reset_token,
    generate_backup_codes,
)
from app.core.config import settings
from app.services.audit_service import AuditService


class AuthService:
    """Authentication service for user login, registration, and session management"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)

    async def register_user(
        self,
        user_data: UserRegister,
        ip_address: Optional[str] = None
    ) -> Tuple[User, Organization]:
        """
        Register a new user and optionally create a new organization.

        Args:
            user_data: User registration data
            ip_address: IP address of the request

        Returns:
            Tuple[User, Organization]: Created user and organization

        Raises:
            HTTPException: If validation fails or user already exists
        """
        # Validate password strength
        is_valid, error_msg = validate_password_strength(user_data.password)
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

        # Check if email already exists
        existing_user = await self.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Check if username already exists
        existing_user = await self.get_user_by_username(user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

        # Handle organization
        if user_data.org_code:
            # Join existing organization
            org = await self.get_organization_by_code(user_data.org_code)
            if not org:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Organization not found"
                )
        else:
            # Create new organization
            if not user_data.org_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Organization name required for new organization"
                )

            org_code = self._generate_org_code(user_data.org_name)
            org = Organization(
                org_code=org_code,
                org_name=user_data.org_name,
                subscription_tier=settings.DEFAULT_SUBSCRIPTION_TIER,
                subscription_status="active",
                subscription_start_date=datetime.utcnow(),
                subscription_end_date=datetime.utcnow() + timedelta(days=settings.TRIAL_PERIOD_DAYS),
                max_users=settings.DEFAULT_MAX_USERS,
                max_storage_gb=settings.DEFAULT_MAX_STORAGE_GB,
                max_api_calls_per_day=settings.DEFAULT_MAX_API_CALLS_PER_DAY,
                primary_contact_email=user_data.email,
                primary_contact_name=f"{user_data.first_name} {user_data.last_name}",
                is_active=True,
            )
            self.db.add(org)
            await self.db.flush()

        # Create user
        user = User(
            org_id=org.id,
            email=user_data.email,
            username=user_data.username,
            hashed_password=get_password_hash(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            full_name=f"{user_data.first_name} {user_data.last_name}",
            phone=user_data.phone,
            email_verified=False,
            email_verification_token=generate_email_verification_token(),
            is_active=True,
        )
        self.db.add(user)
        await self.db.flush()

        # Assign default role
        await self._assign_default_role(user, is_first_user=(not user_data.org_code))

        await self.db.commit()
        await self.db.refresh(user)
        await self.db.refresh(org)

        # Log registration
        await self.audit_service.log_event(
            org_id=org.id,
            user_id=user.id,
            event_type="user.register",
            event_category="auth",
            action="create",
            resource_type="user",
            resource_id=user.id,
            status="success",
            ip_address=ip_address,
        )

        return user, org

    async def login(
        self,
        credentials: UserLogin,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[Token, User]:
        """
        Authenticate user and create session.

        Args:
            credentials: Login credentials
            ip_address: IP address of the request
            user_agent: User agent string

        Returns:
            Tuple[Token, User]: JWT tokens and user object

        Raises:
            HTTPException: If authentication fails
        """
        # Get user by email or username
        user = await self.get_user_by_email_or_username(credentials.username_or_email)

        if not user:
            await self._log_failed_login(credentials.username_or_email, ip_address, "user_not_found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )

        # Check if user is active
        if not user.is_active:
            await self._log_failed_login(credentials.username_or_email, ip_address, "user_inactive")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )

        # Check if user is locked
        if user.is_locked:
            await self._log_failed_login(credentials.username_or_email, ip_address, "user_locked")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is locked due to too many failed login attempts"
            )

        # Verify password
        if not verify_password(credentials.password, user.hashed_password):
            await self._handle_failed_login(user, ip_address)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )

        # Reset failed login attempts
        user.failed_login_attempts = 0

        # Check 2FA
        if user.two_factor_enabled:
            # Return special token indicating 2FA required
            # Frontend should prompt for 2FA code
            # This is a simplified implementation
            pass

        # Create session
        session = await self.create_session(user, ip_address, user_agent, credentials.remember_me)

        # Update last login
        user.last_login_date = datetime.utcnow()
        user.last_login_ip = ip_address

        await self.db.commit()

        # Create tokens
        token_data = {
            "user_id": str(user.id),
            "username": user.username,
            "email": user.email,
            "org_id": str(user.org_id),
            "session_id": str(session.id),
        }

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        access_token = create_access_token(token_data, access_token_expires)
        refresh_token = create_refresh_token(token_data, refresh_token_expires)

        # Update session with tokens
        session.access_token = access_token
        session.refresh_token = refresh_token
        await self.db.commit()

        # Log successful login
        await self.audit_service.log_event(
            org_id=user.org_id,
            user_id=user.id,
            event_type="user.login",
            event_category="auth",
            action="login",
            status="success",
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session.id,
        )

        token = Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

        return token, user

    async def logout(self, user: User, session_id: UUID):
        """
        Logout user and revoke session.

        Args:
            user: User object
            session_id: Session ID to revoke
        """
        session = await self.db.get(Session, session_id)
        if session and session.user_id == user.id:
            session.is_active = False
            session.logout_date = datetime.utcnow()
            session.revoke("User logout")
            await self.db.commit()

            # Log logout
            await self.audit_service.log_event(
                org_id=user.org_id,
                user_id=user.id,
                event_type="user.logout",
                event_category="auth",
                action="logout",
                status="success",
                session_id=session_id,
            )

    async def refresh_access_token(self, refresh_token: str) -> Token:
        """
        Refresh access token using refresh token.

        Args:
            refresh_token: Refresh token

        Returns:
            Token: New access and refresh tokens

        Raises:
            HTTPException: If refresh token is invalid
        """
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        user_id = payload.get("user_id")
        session_id = payload.get("session_id")

        if not user_id or not session_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        # Get session
        session = await self.db.get(Session, UUID(session_id))
        if not session or not session.is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired or invalid"
            )

        # Get user
        user = await self.db.get(User, UUID(user_id))
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )

        # Create new tokens
        token_data = {
            "user_id": str(user.id),
            "username": user.username,
            "email": user.email,
            "org_id": str(user.org_id),
            "session_id": str(session.id),
        }

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        new_access_token = create_access_token(token_data, access_token_expires)
        new_refresh_token = create_refresh_token(token_data, refresh_token_expires)

        # Update session
        session.access_token = new_access_token
        session.refresh_token = new_refresh_token
        session.update_activity()
        await self.db.commit()

        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def create_session(
        self,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        remember_me: bool = False
    ) -> Session:
        """
        Create a new session for user.

        Args:
            user: User object
            ip_address: IP address
            user_agent: User agent string
            remember_me: Remember user flag

        Returns:
            Session: Created session
        """
        # Check max sessions per user
        active_sessions_count = await self.db.scalar(
            select(func.count(Session.id))
            .where(and_(Session.user_id == user.id, Session.is_active == True))
        )

        if active_sessions_count >= settings.MAX_SESSIONS_PER_USER:
            # Revoke oldest session
            oldest_session = await self.db.scalar(
                select(Session)
                .where(and_(Session.user_id == user.id, Session.is_active == True))
                .order_by(Session.last_activity_date.asc())
                .limit(1)
            )
            if oldest_session:
                oldest_session.revoke("Max sessions exceeded")

        # Determine token expiry
        if remember_me:
            token_expiry = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        else:
            token_expiry = datetime.utcnow() + timedelta(hours=settings.SESSION_EXPIRE_HOURS)

        session = Session(
            user_id=user.id,
            session_token=create_session_token(),
            token_expiry_date=token_expiry,
            ip_address=ip_address,
            user_agent=user_agent,
            is_active=True,
        )
        self.db.add(session)
        await self.db.flush()

        return session

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_user_by_email_or_username(self, identifier: str) -> Optional[User]:
        """Get user by email or username"""
        result = await self.db.execute(
            select(User).where(
                (User.email == identifier) | (User.username == identifier)
            )
        )
        return result.scalar_one_or_none()

    async def get_organization_by_code(self, org_code: str) -> Optional[Organization]:
        """Get organization by code"""
        result = await self.db.execute(
            select(Organization).where(Organization.org_code == org_code)
        )
        return result.scalar_one_or_none()

    async def _assign_default_role(self, user: User, is_first_user: bool = False):
        """Assign default role to user"""
        if is_first_user:
            # First user becomes organization admin
            role_code = "org_admin"
        else:
            # Default user role
            role_code = "user"

        # Get role
        result = await self.db.execute(
            select(Role).where(Role.role_code == role_code, Role.org_id.is_(None))
        )
        role = result.scalar_one_or_none()

        if role:
            user_role = UserRole(
                user_id=user.id,
                role_id=role.id,
                assigned_by=user.id,
                is_active=True,
            )
            self.db.add(user_role)

    async def _handle_failed_login(self, user: User, ip_address: Optional[str] = None):
        """Handle failed login attempt"""
        user.failed_login_attempts += 1

        # Lock account after 5 failed attempts
        if user.failed_login_attempts >= 5:
            user.is_locked = True

        await self.db.commit()

        # Log failed login
        await self.audit_service.log_event(
            org_id=user.org_id,
            user_id=user.id,
            event_type="user.login.failed",
            event_category="auth",
            action="login",
            status="failed",
            ip_address=ip_address,
            severity="warning",
            is_security_event=True,
        )

    async def _log_failed_login(self, identifier: str, ip_address: Optional[str] = None, reason: str = ""):
        """Log failed login attempt for non-existent user"""
        await self.audit_service.log_event(
            org_id=None,
            user_id=None,
            event_type="user.login.failed",
            event_category="auth",
            action="login",
            status="failed",
            event_description=f"Failed login attempt for: {identifier} ({reason})",
            ip_address=ip_address,
            severity="warning",
            is_security_event=True,
        )

    def _generate_org_code(self, org_name: str) -> str:
        """Generate organization code from name"""
        import re
        # Remove special characters and convert to lowercase
        code = re.sub(r'[^a-zA-Z0-9]', '', org_name).lower()
        # Take first 10 characters
        code = code[:10]
        # Add random suffix to ensure uniqueness
        import secrets
        suffix = secrets.token_hex(3)
        return f"{code}_{suffix}"
