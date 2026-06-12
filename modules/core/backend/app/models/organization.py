from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base


class Organization(Base):
    __tablename__ = "core_organizations"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Organization Info
    org_code = Column(String(50), unique=True, nullable=False, index=True)
    org_name = Column(String(255), nullable=False)
    org_description = Column(Text)

    # Subscription & Billing
    subscription_tier = Column(String(50), default='trial')  # trial, basic, professional, enterprise
    subscription_status = Column(String(50), default='active')  # active, suspended, cancelled, expired
    subscription_start_date = Column(DateTime)
    subscription_end_date = Column(DateTime)
    billing_cycle = Column(String(20), default='monthly')  # monthly, annual

    # Module Access
    enabled_modules = Column(JSONB, default=list)  # ['crm', 'hr', 'accounting', 'production']

    # Quotas & Limits
    max_users = Column(Integer, default=10)
    max_storage_gb = Column(Integer, default=10)
    max_api_calls_per_day = Column(Integer, default=10000)
    current_user_count = Column(Integer, default=0)
    current_storage_gb = Column(DECIMAL(10, 2), default=0)

    # Branding
    branding = Column(JSONB, default=dict)  # logo_url, primary_color, secondary_color
    custom_domain = Column(String(255))

    # Contact Info
    primary_contact_name = Column(String(255))
    primary_contact_email = Column(String(255))
    primary_contact_phone = Column(String(50))

    # Business Info
    business_type = Column(String(100))
    industry = Column(String(100))
    company_size = Column(String(50))
    timezone = Column(String(100), default='UTC')
    currency_code = Column(String(10), default='USD')

    # Address
    billing_address = Column(JSONB, default=dict)  # street, city, state, postal_code, country

    # Features & Settings
    feature_flags = Column(JSONB, default=dict)
    organization_settings = Column(JSONB, default=dict)

    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    deleted_flag = Column(Boolean, default=False)

    # Audit Fields
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True))
    last_modified_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_modified_by = Column(UUID(as_uuid=True))
    deleted_date = Column(DateTime)
    deleted_by = Column(UUID(as_uuid=True))

    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    roles = relationship("Role", back_populates="organization", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organization", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="organization", cascade="all, delete-orphan")
    settings = relationship("Setting", back_populates="organization", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="organization", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Organization(id={self.id}, org_code={self.org_code}, org_name={self.org_name})>"
