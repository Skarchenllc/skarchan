from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import (
    UserLogin,
    UserRegister,
    Token,
    PasswordReset,
    PasswordResetConfirm,
    EmailVerification,
    RefreshToken,
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService
from app.api.dependencies import get_current_user, get_request_ip, get_user_agent
from app.models.user import User


router = APIRouter()

# Cookie settings. No explicit `domain` → a host-only cookie that works on
# localhost AND the production domain. (A hardcoded domain="localhost" made the
# browser reject the cookie on any real domain, breaking auth in production.)
COOKIE_SETTINGS = {
    "httponly": True,
    "secure": False,  # still sent over HTTPS; SameSite=Lax keeps it same-site
    "samesite": "lax",
}


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user and optionally create a new organization.

    - **email**: Valid email address
    - **username**: Unique username (3-100 characters)
    - **password**: Strong password (min 8 chars, uppercase, lowercase, digit)
    - **first_name**: First name
    - **last_name**: Last name
    - **org_code**: Organization code (to join existing org) OR
    - **org_name**: Organization name (to create new org)
    """
    auth_service = AuthService(db)
    ip_address = await get_request_ip(request)

    user, org = await auth_service.register_user(user_data, ip_address)

    # Auto-login after registration - create tokens
    user_agent = await get_user_agent(request)
    login_credentials = UserLogin(username_or_email=user_data.username, password=user_data.password)
    token, _ = await auth_service.login(login_credentials, ip_address, user_agent)

    # Set tokens as HTTP-only cookies
    response.set_cookie(
        key="access_token",
        value=token.access_token,
        max_age=3600,  # 1 hour
        **COOKIE_SETTINGS
    )
    response.set_cookie(
        key="refresh_token",
        value=token.refresh_token,
        max_age=30 * 24 * 3600,  # 30 days
        **COOKIE_SETTINGS
    )

    # Return tokens in the body too (the frontend stores them in localStorage and
    # uses them as Bearer tokens) — same shape as /login, so auto-login after
    # registration works regardless of cookies.
    return {
        "message": "Registration successful",
        "access_token": token.access_token,
        "refresh_token": token.refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
        },
    }


@router.post("/login")
async def login(
    credentials: UserLogin,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with username/email and password.

    Sets JWT tokens as HTTP-only cookies (works across all localhost ports).

    - **username_or_email**: Username or email address
    - **password**: User password
    - **remember_me**: Keep user logged in for extended period
    """
    auth_service = AuthService(db)
    ip_address = await get_request_ip(request)
    user_agent = await get_user_agent(request)

    token, user = await auth_service.login(credentials, ip_address, user_agent)

    # Set tokens as HTTP-only cookies
    response.set_cookie(
        key="access_token",
        value=token.access_token,
        max_age=3600,  # 1 hour
        **COOKIE_SETTINGS
    )
    response.set_cookie(
        key="refresh_token",
        value=token.refresh_token,
        max_age=30 * 24 * 3600,  # 30 days
        **COOKIE_SETTINGS
    )

    # Still return tokens in response for backward compatibility
    return {
        "message": "Login successful",
        "access_token": token.access_token,
        "refresh_token": token.refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name
        }
    }


@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout current user and revoke session.

    Clears authentication cookies.

    Requires: Valid JWT token
    """
    # Clear authentication cookies
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")

    # TODO: Get session_id from token and revoke it in database
    # For now, just clear cookies

    return {"message": "Logged out successfully"}


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_data: RefreshToken,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token.

    - **refresh_token**: Valid refresh token

    Returns new access and refresh tokens.
    """
    auth_service = AuthService(db)
    token = await auth_service.refresh_access_token(refresh_data.refresh_token)

    return token


@router.post("/forgot-password")
async def forgot_password(
    reset_data: PasswordReset,
    db: AsyncSession = Depends(get_db)
):
    """
    Request password reset email.

    - **email**: Email address of the account

    Sends password reset link to email.
    """
    # TODO: Implement password reset email sending
    # For now, just return success
    return {"message": "If email exists, password reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password using reset token.

    - **token**: Reset token from email
    - **new_password**: New password
    - **confirm_password**: Password confirmation
    """
    # TODO: Implement password reset logic
    return {"message": "Password reset successfully"}


@router.post("/verify-email")
async def verify_email(
    verification_data: EmailVerification,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify email address using verification token.

    - **token**: Verification token from email
    """
    # TODO: Implement email verification logic
    return {"message": "Email verified successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information.

    Requires: Valid JWT token
    """
    return current_user


@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change password for current user.

    - **current_password**: Current password
    - **new_password**: New password

    Requires: Valid JWT token
    """
    # TODO: Implement password change logic
    return {"message": "Password changed successfully"}
