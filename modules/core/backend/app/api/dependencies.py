from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.db.session import get_db
from app.models.user import User
from app.models.session import Session as UserSession
from app.core.security import decode_token
from app.services.permission_service import PermissionService


# Security scheme
security = HTTPBearer()


async def get_current_user_optional(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Resolve the current user from a cookie/Bearer token, or None if not authenticated."""
    token = request.cookies.get("access_token") or (credentials.credentials if credentials else None)
    if not token:
        return None
    payload = decode_token(token)
    if not payload or payload.get("type") != "access" or not payload.get("user_id"):
        return None
    try:
        user = await db.get(User, UUID(payload["user_id"]))
    except Exception:
        return None
    return user if (user and user.is_active) else None


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.

    Token can be provided either via:
    1. HTTP-only cookie (access_token) - preferred for cross-origin
    2. Authorization header (Bearer token) - for API clients

    Args:
        request: FastAPI request
        credentials: HTTP authorization credentials (optional)
        db: Database session

    Returns:
        User: Current user

    Raises:
        HTTPException: If authentication fails
    """
    # Try to get token from cookie first (for cross-port auth)
    token = request.cookies.get("access_token")

    # Fall back to Authorization header if no cookie
    if not token and credentials:
        token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Decode token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user ID from payload
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from database
    user = await db.get(User, UUID(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Check if user is locked
    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is locked",
        )

    # Verify session is valid
    session_id = payload.get("session_id")
    if session_id:
        session = await db.get(UserSession, UUID(session_id))
        if not session or not session.is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired or invalid",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Update session activity
        session.update_activity()
        await db.commit()

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user (alias for get_current_user).

    Args:
        current_user: Current user from get_current_user

    Returns:
        User: Current active user
    """
    return current_user


async def get_optional_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, otherwise None.
    Used for endpoints that work with or without authentication.

    Token can be provided either via:
    1. HTTP-only cookie (access_token) - preferred for cross-origin
    2. Authorization header (Bearer token) - for API clients

    Args:
        request: FastAPI request
        credentials: HTTP authorization credentials (optional)
        db: Database session

    Returns:
        Optional[User]: Current user or None
    """
    # Try to get token from cookie first
    token = request.cookies.get("access_token")

    # Fall back to Authorization header if no cookie
    if not token and credentials:
        token = credentials.credentials

    if not token:
        return None

    try:
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            return None

        user_id = payload.get("user_id")
        if not user_id:
            return None

        user = await db.get(User, UUID(user_id))
        if not user or not user.is_active:
            return None

        return user
    except Exception:
        return None


class PermissionChecker:
    """
    Dependency class to check if user has required permission.

    Usage:
        @router.get("/accounts")
        async def get_accounts(
            current_user: User = Depends(get_current_user),
            _: None = Depends(PermissionChecker("crm.accounts.read"))
        ):
            ...
    """

    def __init__(self, permission_code: str):
        self.permission_code = permission_code

    async def __call__(
        self,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        permission_service = PermissionService(db)
        has_permission = await permission_service.check_permission(
            current_user,
            self.permission_code
        )

        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {self.permission_code}"
            )


def require_permission(permission_code: str):
    """
    Decorator-friendly permission checker.

    Usage:
        @router.get("/accounts", dependencies=[Depends(require_permission("crm.accounts.read"))])
        async def get_accounts():
            ...
    """
    return PermissionChecker(permission_code)


async def get_request_ip(request: Request) -> str:
    """
    Get client IP address from request.

    Args:
        request: FastAPI request

    Returns:
        str: Client IP address
    """
    # Check for forwarded IP (behind proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()

    # Check for real IP
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # Fallback to direct client
    return request.client.host if request.client else "unknown"


async def get_user_agent(request: Request) -> str:
    """
    Get user agent from request.

    Args:
        request: FastAPI request

    Returns:
        str: User agent string
    """
    return request.headers.get("User-Agent", "unknown")
