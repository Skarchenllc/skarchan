from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime


class UserLogin(BaseModel):
    """User login request"""
    username_or_email: str = Field(..., description="Username or email address")
    password: str = Field(..., min_length=8, description="User password")
    remember_me: bool = Field(default=False, description="Keep user logged in")


class UserRegister(BaseModel):
    """User registration request"""
    email: EmailStr = Field(..., description="Email address")
    username: str = Field(..., min_length=3, max_length=100, description="Unique username")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    confirm_password: str = Field(..., description="Password confirmation")
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    phone: Optional[str] = Field(None, description="Phone number")
    org_code: Optional[str] = Field(None, description="Organization code (for existing org)")
    org_name: Optional[str] = Field(None, description="Organization name (for new org)")

    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

    @validator('password')
    def password_strength(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        return v


class Token(BaseModel):
    """JWT token response"""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiry in seconds")


class TokenData(BaseModel):
    """Token payload data"""
    user_id: str
    username: str
    email: str
    org_id: str
    roles: list[str] = []
    permissions: list[str] = []


class PasswordReset(BaseModel):
    """Password reset request"""
    email: EmailStr = Field(..., description="Email address")


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation"""
    token: str = Field(..., description="Reset token from email")
    new_password: str = Field(..., min_length=8, description="New password")
    confirm_password: str = Field(..., description="Password confirmation")

    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


class EmailVerification(BaseModel):
    """Email verification request"""
    token: str = Field(..., description="Verification token from email")


class TwoFactorSetup(BaseModel):
    """Two-factor authentication setup response"""
    secret: str = Field(..., description="TOTP secret")
    qr_code_url: str = Field(..., description="QR code URL for authenticator app")
    backup_codes: list[str] = Field(..., description="Backup codes for account recovery")


class TwoFactorVerify(BaseModel):
    """Two-factor authentication verification"""
    code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code")


class RefreshToken(BaseModel):
    """Refresh token request"""
    refresh_token: str = Field(..., description="Refresh token")
