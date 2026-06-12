from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base


class User(Base):
    __tablename__ = "core_users"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Organization (Multi-tenancy)
    org_id = Column(UUID(as_uuid=True), ForeignKey("core_organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)

    # Profile Info
    first_name = Column(String(100))
    last_name = Column(String(100))
    full_name = Column(String(255))
    phone = Column(String(50))
    phone_mobile = Column(String(50))
    job_title = Column(String(100))
    department = Column(String(100))
    employee_id = Column(String(50))

    # Avatar & Profile
    profile_photo_url = Column(String(500))
    bio = Column(Text)

    # Two-Factor Authentication
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(255))  # TOTP secret
    backup_codes = Column(JSONB, default=list)  # List of backup codes

    # Email Verification
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(255))
    email_verification_sent_date = Column(DateTime)

    # Password Reset
    password_reset_token = Column(String(255))
    password_reset_expiry = Column(DateTime)

    # Status & Access
    is_active = Column(Boolean, default=True)
    is_locked = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    last_login_date = Column(DateTime)
    last_login_ip = Column(String(50))

    # User Settings
    preferences = Column(JSONB, default=dict)  # UI preferences, notification settings
    timezone = Column(String(100), default='UTC')
    language = Column(String(10), default='en')
    date_format = Column(String(50), default='YYYY-MM-DD')
    time_format = Column(String(50), default='24h')

    # Session Management
    current_session_token = Column(String(500))
    refresh_token = Column(String(500))
    token_expiry = Column(DateTime)

    # Soft Delete
    deleted_flag = Column(Boolean, default=False)

    # Audit Fields
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True))
    last_modified_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_modified_by = Column(UUID(as_uuid=True))
    deleted_date = Column(DateTime)
    deleted_by = Column(UUID(as_uuid=True))

    # Relationships
    organization = relationship("Organization", back_populates="users")
    user_roles = relationship("UserRole", back_populates="user", foreign_keys="[UserRole.user_id]", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="[AuditLog.user_id]", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", foreign_keys="[Notification.user_id]", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"

    @property
    def display_name(self):
        """Return full name if available, otherwise username"""
        if self.full_name:
            return self.full_name
        elif self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username

    def has_permission(self, permission_code: str) -> bool:
        """Check if user has a specific permission through their roles"""
        for user_role in self.user_roles:
            if user_role.role.has_permission(permission_code):
                return True
        return False

    def get_all_permissions(self) -> list:
        """Get all permissions from all assigned roles"""
        permissions = set()
        for user_role in self.user_roles:
            permissions.update(user_role.role.permissions or [])
        return list(permissions)
