from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid

from app.db.session import Base


class Session(Base):
    __tablename__ = "core_sessions"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # User
    user_id = Column(UUID(as_uuid=True), ForeignKey("core_users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Session Tokens
    session_token = Column(String(500), unique=True, nullable=False, index=True)
    refresh_token = Column(String(500), unique=True, index=True)
    access_token = Column(String(500))

    # Token Expiry
    token_created_date = Column(DateTime, default=datetime.utcnow)
    token_expiry_date = Column(DateTime, nullable=False)
    refresh_token_expiry_date = Column(DateTime)

    # Device & Location Info
    device_type = Column(String(50))  # desktop, mobile, tablet
    device_name = Column(String(255))
    operating_system = Column(String(100))
    browser = Column(String(100))
    browser_version = Column(String(50))

    # Network Info
    ip_address = Column(INET)
    user_agent = Column(String(500))
    location_country = Column(String(100))
    location_city = Column(String(100))

    # Session Activity
    last_activity_date = Column(DateTime, default=datetime.utcnow, index=True)
    login_date = Column(DateTime, default=datetime.utcnow)
    logout_date = Column(DateTime)

    # Session Status
    is_active = Column(Boolean, default=True, index=True)
    is_revoked = Column(Boolean, default=False)
    revoked_date = Column(DateTime)
    revoked_reason = Column(String(255))

    # Security
    is_trusted_device = Column(Boolean, default=False)
    requires_2fa = Column(Boolean, default=False)
    two_factor_verified = Column(Boolean, default=False)

    # Session Metadata
    session_metadata = Column(JSONB, default=dict)

    # Activity Tracking
    request_count = Column(Integer, default=0)
    last_request_path = Column(String(500))

    # Audit Fields
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="sessions")

    def __repr__(self):
        return f"<Session(id={self.id}, user_id={self.user_id}, is_active={self.is_active}, created_date={self.created_date})>"

    @property
    def is_expired(self) -> bool:
        """Check if session has expired"""
        if not self.token_expiry_date:
            return True
        return datetime.utcnow() > self.token_expiry_date

    @property
    def is_valid(self) -> bool:
        """Check if session is valid and active"""
        return (
            self.is_active and
            not self.is_revoked and
            not self.is_expired
        )

    @property
    def time_since_last_activity(self) -> timedelta:
        """Get time since last activity"""
        if not self.last_activity_date:
            return timedelta(0)
        return datetime.utcnow() - self.last_activity_date

    @property
    def session_duration(self) -> timedelta:
        """Get total session duration"""
        end_time = self.logout_date or datetime.utcnow()
        return end_time - self.login_date

    def revoke(self, reason: str = None):
        """Revoke this session"""
        self.is_active = False
        self.is_revoked = True
        self.revoked_date = datetime.utcnow()
        self.revoked_reason = reason

    def refresh(self, new_token: str, expiry_minutes: int = 60):
        """Refresh session with new token"""
        self.session_token = new_token
        self.token_expiry_date = datetime.utcnow() + timedelta(minutes=expiry_minutes)
        self.last_activity_date = datetime.utcnow()

    def update_activity(self, request_path: str = None):
        """Update last activity timestamp"""
        self.last_activity_date = datetime.utcnow()
        self.request_count += 1
        if request_path:
            self.last_request_path = request_path
