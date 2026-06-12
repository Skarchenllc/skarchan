from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY, INET
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid

from app.db.session import Base


class APIKey(Base):
    __tablename__ = "core_api_keys"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Organization (Multi-tenancy)
    org_id = Column(UUID(as_uuid=True), ForeignKey("core_organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    # Owner
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("core_users.id", ondelete="SET NULL"))

    # API Key
    key_name = Column(String(255), nullable=False)
    key_description = Column(Text)
    api_key = Column(String(255), unique=True, nullable=False, index=True)  # Public key
    api_secret_hash = Column(String(255), nullable=False)  # Hashed secret

    # Key Prefix (for easy identification)
    key_prefix = Column(String(20))  # e.g., "pk_live_", "pk_test_"

    # Permissions & Scope
    scopes = Column(JSONB, default=list)  # ['crm.accounts.read', 'crm.contacts.write']
    allowed_modules = Column(ARRAY(String))  # ['crm', 'hr']

    # Rate Limiting
    rate_limit_per_minute = Column(Integer, default=60)
    rate_limit_per_hour = Column(Integer, default=1000)
    rate_limit_per_day = Column(Integer, default=10000)

    # Usage Tracking
    total_requests = Column(Integer, default=0)
    last_used_date = Column(DateTime)
    last_used_ip = Column(INET)

    # IP Whitelisting
    allowed_ips = Column(JSONB, default=list)  # ['192.168.1.100', '10.0.0.0/24']
    ip_whitelist_enabled = Column(Boolean, default=False)

    # Expiry
    expires_date = Column(DateTime)
    never_expires = Column(Boolean, default=False)

    # Environment
    environment = Column(String(20), default='production')  # production, sandbox, test

    # Webhook Settings
    webhook_url = Column(String(500))
    webhook_events = Column(JSONB, default=list)  # Events to send to webhook

    # Status
    is_active = Column(Boolean, default=True, index=True)
    is_revoked = Column(Boolean, default=False)
    revoked_date = Column(DateTime)
    revoked_reason = Column(Text)

    # Metadata
    api_key_metadata = Column(JSONB, default=dict)

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
    organization = relationship("Organization", back_populates="api_keys")
    creator = relationship("User", foreign_keys=[created_by_user_id])

    def __repr__(self):
        return f"<APIKey(id={self.id}, key_name={self.key_name}, org_id={self.org_id}, is_active={self.is_active})>"

    @property
    def is_expired(self) -> bool:
        """Check if API key has expired"""
        if self.never_expires:
            return False
        if not self.expires_date:
            return False
        return datetime.utcnow() > self.expires_date

    @property
    def is_valid(self) -> bool:
        """Check if API key is valid and can be used"""
        return (
            self.is_active and
            not self.is_revoked and
            not self.is_expired and
            not self.deleted_flag
        )

    @property
    def days_until_expiry(self) -> int:
        """Get number of days until expiry"""
        if self.never_expires or not self.expires_date:
            return -1  # Never expires
        delta = self.expires_date - datetime.utcnow()
        return max(0, delta.days)

    def has_scope(self, scope: str) -> bool:
        """Check if API key has a specific scope"""
        if not self.scopes:
            return False

        # Wildcard scope
        if "*" in self.scopes:
            return True

        # Direct scope match
        if scope in self.scopes:
            return True

        # Module wildcard match (e.g., 'crm.*' matches 'crm.accounts.read')
        parts = scope.split('.')
        if len(parts) >= 2:
            module_wildcard = f"{parts[0]}.*"
            if module_wildcard in self.scopes:
                return True

        return False

    def is_ip_allowed(self, ip_address: str) -> bool:
        """Check if IP address is allowed"""
        if not self.ip_whitelist_enabled:
            return True

        if not self.allowed_ips:
            return True

        # Simple IP matching (can be enhanced with CIDR notation support)
        return ip_address in self.allowed_ips

    def revoke(self, reason: str = None):
        """Revoke this API key"""
        self.is_active = False
        self.is_revoked = True
        self.revoked_date = datetime.utcnow()
        self.revoked_reason = reason

    def record_usage(self, ip_address: str = None):
        """Record API key usage"""
        self.total_requests += 1
        self.last_used_date = datetime.utcnow()
        if ip_address:
            self.last_used_ip = ip_address
