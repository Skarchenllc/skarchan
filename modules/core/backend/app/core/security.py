from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from uuid import UUID
import secrets
import string

from app.core.config import settings

# Password hashing context
# Using bcrypt with truncate_error=False to handle passwords > 72 bytes
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__ident="2b",  # Use $2b$ bcrypt format
    bcrypt__min_rounds=12,
    bcrypt__max_rounds=12,
    bcrypt__truncate_error=False  # Silently truncate passwords > 72 bytes
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password

    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    Bcrypt has a 72-byte limit, so we truncate if necessary.

    Args:
        password: Plain text password

    Returns:
        str: Hashed password
    """
    # Bcrypt has a 72-byte limit
    password_bytes = password.encode('utf-8')[:72]
    return pwd_context.hash(password_bytes.decode('utf-8', errors='ignore'))


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password strength based on configured requirements.

    Args:
        password: Password to validate

    Returns:
        tuple: (is_valid, error_message)
    """
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        return False, f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters"

    if settings.PASSWORD_REQUIRE_UPPERCASE and not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"

    if settings.PASSWORD_REQUIRE_LOWERCASE and not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"

    if settings.PASSWORD_REQUIRE_DIGIT and not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"

    if settings.PASSWORD_REQUIRE_SPECIAL:
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        if not any(c in special_chars for c in password):
            return False, "Password must contain at least one special character"

    return True, None


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.

    Args:
        data: Payload data to encode
        expires_delta: Token expiry duration

    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token.

    Args:
        data: Payload data to encode
        expires_delta: Token expiry duration

    Returns:
        str: Encoded JWT refresh token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT token.

    Args:
        token: JWT token string

    Returns:
        Optional[Dict]: Token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def generate_random_token(length: int = 32) -> str:
    """
    Generate a random secure token.

    Args:
        length: Token length

    Returns:
        str: Random token
    """
    return secrets.token_urlsafe(length)


def generate_api_key() -> str:
    """
    Generate a random API key.

    Returns:
        str: API key with 'pk_' prefix
    """
    random_part = secrets.token_urlsafe(32)
    return f"pk_{random_part}"


def generate_api_secret() -> str:
    """
    Generate a random API secret.

    Returns:
        str: API secret
    """
    return secrets.token_urlsafe(48)


def hash_api_secret(secret: str) -> str:
    """
    Hash an API secret.

    Args:
        secret: Plain API secret

    Returns:
        str: Hashed secret
    """
    return get_password_hash(secret)


def verify_api_secret(plain_secret: str, hashed_secret: str) -> bool:
    """
    Verify an API secret against a hashed secret.

    Args:
        plain_secret: Plain API secret
        hashed_secret: Hashed API secret

    Returns:
        bool: True if secret matches, False otherwise
    """
    return verify_password(plain_secret, hashed_secret)


def generate_backup_codes(count: int = 10) -> list[str]:
    """
    Generate backup codes for 2FA recovery.

    Args:
        count: Number of backup codes to generate

    Returns:
        list: List of backup codes
    """
    codes = []
    for _ in range(count):
        # Generate 8-digit backup code
        code = ''.join(secrets.choice(string.digits) for _ in range(8))
        # Format as XXXX-XXXX
        formatted_code = f"{code[:4]}-{code[4:]}"
        codes.append(formatted_code)
    return codes


def generate_email_verification_token() -> str:
    """
    Generate a token for email verification.

    Returns:
        str: Verification token
    """
    return generate_random_token(48)


def generate_password_reset_token() -> str:
    """
    Generate a token for password reset.

    Returns:
        str: Reset token
    """
    return generate_random_token(48)


def create_session_token() -> str:
    """
    Create a unique session token.

    Returns:
        str: Session token
    """
    return secrets.token_urlsafe(64)
